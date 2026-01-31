// Barista Board Operations
// Coffee-themed Kanban board for game studios
import { getSupabaseAdmin } from "./supabase.js";
import { generateId, getCurrentTimestamp } from "./dynamodb-schema.js";

const getSupabase = () => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
};

// ===========================================
// BOARD OPERATIONS
// ===========================================

export const createBoard = async (boardData) => {
  const supabase = getSupabase();
  const boardId = generateId('board');
  const now = getCurrentTimestamp();
  
  // Ensure settings is a proper JSON object for JSONB
  const settings = boardData.settings || {
    wipLimits: {},
    swimlanesEnabled: false,
    defaultColumns: ['backlog', 'brewing', 'tasting', 'refining', 'served']
  };
  
  // Verify project exists and get owner
  const { data: project } = await supabase
    .from('projects')
    .select('project_id, user_id')
    .eq('project_id', boardData.projectId)
    .single();
  
  if (!project) {
    throw new Error(`Project ${boardData.projectId} not found`);
  }
  
  // Use project owner as the creator (more reliable than temp users)
  const userId = project.user_id || boardData.createdBy;
  
  // Verify user exists
  const { data: userCheck } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  if (!userCheck) {
    throw new Error(`User ${userId} not found. Please ensure you're logged in with a valid account.`);
  }
  
  const board = {
    board_id: boardId,
    project_id: boardData.projectId,
    name: boardData.name,
    description: boardData.description || '',
    settings: settings, // Supabase will handle JSONB conversion
    created_by: userId,
    created_at: now,
    updated_at: now,
    is_archived: false
  };

  console.log('Creating board with data:', { ...board, settings: JSON.stringify(settings) });

  const { data, error } = await supabase
    .from('barista_boards')
    .insert(board)
    .select()
    .single();

  if (error) {
    console.error('Error inserting board:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  console.log('Board created, creating columns...');

  // Create default columns
  const defaultColumns = [
    { name: '🫘 Backlog', position: 0, color: '#6B4423' },
    { name: '☕ Brewing', position: 1, color: '#8B5A2B' },
    { name: '🧪 Tasting', position: 2, color: '#A67C52' },
    { name: '🥛 Refining', position: 3, color: '#C49A6C' },
    { name: '✅ Served', position: 4, color: '#D4A574' }
  ];

  try {
    for (const col of defaultColumns) {
      await createColumn({
        boardId: boardId,
        name: col.name,
        position: col.position,
        color: col.color
      });
    }
    console.log('Columns created successfully');
  } catch (colError) {
    console.error('Error creating columns:', colError);
    // Don't fail the whole operation if columns fail - they can be created manually
  }

  // Add creator as owner
  try {
    await addBoardMember(boardId, userId, 'owner');
    console.log('Board member added successfully');
  } catch (memberError) {
    console.error('Error adding board member:', memberError);
    // Don't fail the whole operation if member add fails - user can be added manually
  }

  return data;
};

export const getBoard = async (boardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_boards')
    .select('*')
    .eq('board_id', boardId)
    .single();

  if (error) throw error;
  return data;
};

export const getBoardsByProject = async (projectId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_boards')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateBoard = async (boardId, updates) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_boards')
    .update({ ...updates, updated_at: getCurrentTimestamp() })
    .eq('board_id', boardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ===========================================
// COLUMN OPERATIONS
// ===========================================

export const createColumn = async (columnData) => {
  const supabase = getSupabase();
  const columnId = generateId('col');
  
  const column = {
    column_id: columnId,
    board_id: columnData.boardId,
    name: columnData.name,
    position: columnData.position,
    wip_limit: columnData.wipLimit || null,
    color: columnData.color || '#8B5A2B',
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };

  const { data, error } = await supabase
    .from('barista_columns')
    .insert(column)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getColumnsByBoard = async (boardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
};

export const updateColumn = async (columnId, updates) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_columns')
    .update({ ...updates, updated_at: getCurrentTimestamp() })
    .eq('column_id', columnId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const reorderColumns = async (boardId, columnPositions) => {
  const supabase = getSupabase();
  const updates = columnPositions.map(({ columnId, position }) =>
    supabase
      .from('barista_columns')
      .update({ position, updated_at: getCurrentTimestamp() })
      .eq('column_id', columnId)
  );

  await Promise.all(updates);
};

// ===========================================
// CARD OPERATIONS
// ===========================================

export const createCard = async (cardData) => {
  const supabase = getSupabase();
  const cardId = generateId('card');
  const now = getCurrentTimestamp();

  // Get max position in column
  const { data: maxPos } = await supabase
    .from('barista_cards')
    .select('position')
    .eq('column_id', cardData.columnId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const card = {
    card_id: cardId,
    board_id: cardData.boardId,
    column_id: cardData.columnId,
    title: cardData.title,
    description: cardData.description || '',
    card_type: cardData.cardType || 'engineering',
    priority: cardData.priority || 'medium',
    status: cardData.status || 'brewing',
    assignee_ids: cardData.assigneeIds || [],
    tags: cardData.tags || [],
    due_date: cardData.dueDate || null,
    time_estimate: cardData.timeEstimate || null,
    linked_build_id: cardData.linkedBuildId || null,
    linked_build_url: cardData.linkedBuildUrl || null,
    engine_context: cardData.engineContext || {
      engine: null,
      version: null,
      level: null,
      map: null,
      assetNames: [],
      coordinates: { x: null, y: null, z: null, cameraRotation: null }
    },
    position: maxPos?.position !== undefined ? maxPos.position + 1 : 0,
    created_by: cardData.createdBy,
    created_at: now,
    updated_at: now,
    completed_at: null
  };

  const { data, error } = await supabase
    .from('barista_cards')
    .insert(card)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCardsByBoard = async (boardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_cards')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
};

export const getCard = async (cardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_cards')
    .select('*')
    .eq('card_id', cardId)
    .single();

  if (error) throw error;
  return data;
};

export const updateCard = async (cardId, updates) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_cards')
    .update({ ...updates, updated_at: getCurrentTimestamp() })
    .eq('card_id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const moveCard = async (cardId, newColumnId, newPosition) => {
  const supabase = getSupabase();
  const { data: card } = await getCard(cardId);
  
  // Reorder cards in old column (decrement positions after moved card)
  if (card.column_id !== newColumnId) {
    const { error: decError } = await supabase.rpc('decrement_card_positions', {
      column_id: card.column_id,
      start_position: card.position
    });
    if (decError) {
      // Fallback: manual update
      const { data: oldCards } = await supabase
        .from('barista_cards')
        .select('card_id, position')
        .eq('column_id', card.column_id)
        .gt('position', card.position);
      
      for (const c of oldCards || []) {
        await supabase
          .from('barista_cards')
          .update({ position: c.position - 1 })
          .eq('card_id', c.card_id);
      }
    }
  }

  // Reorder cards in new column (increment positions at target)
  const { data: newCards } = await supabase
    .from('barista_cards')
    .select('card_id, position')
    .eq('column_id', newColumnId)
    .gte('position', newPosition)
    .neq('card_id', cardId);
  
  for (const c of newCards || []) {
    await supabase
      .from('barista_cards')
      .update({ position: c.position + 1 })
      .eq('card_id', c.card_id);
  }

  // Update card
  return await updateCard(cardId, {
    column_id: newColumnId,
    position: newPosition
  });
};

export const deleteCard = async (cardId) => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('barista_cards')
    .delete()
    .eq('card_id', cardId);

  if (error) throw error;
};

// ===========================================
// COMMENT OPERATIONS (3D-ready)
// ===========================================

export const createComment = async (commentData) => {
  const supabase = getSupabase();
  const commentId = generateId('comment');
  
  // Extract mentions from text (@username)
  const mentionRegex = /@(\w+)/g;
  const mentionedUserIds = [];
  let match;
  while ((match = mentionRegex.exec(commentData.text)) !== null) {
    // TODO: Resolve username to user_id
    // For now, store as-is
  }

  const comment = {
    comment_id: commentId,
    card_id: commentData.cardId,
    parent_comment_id: commentData.parentCommentId || null,
    text: commentData.text,
    author_id: commentData.authorId,
    context: commentData.context || {
      type: '2D', // TODO: Support '3D' when Testbox is integrated
      worldPosition: null,
      cameraPose: null,
      buildId: null
    },
    attachments: commentData.attachments || [],
    mentioned_user_ids: mentionedUserIds,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
    is_edited: false,
    is_deleted: false
  };

  const { data, error } = await supabase
    .from('barista_comments')
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCommentsByCard = async (cardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_comments')
    .select('*')
    .eq('card_id', cardId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const updateComment = async (commentId, updates) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_comments')
    .update({ ...updates, updated_at: getCurrentTimestamp(), is_edited: true })
    .eq('comment_id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ===========================================
// ACTIVITY LOG OPERATIONS
// ===========================================

export const logActivity = async (activityData) => {
  const supabase = getSupabase();
  const activityId = generateId('activity');
  
  const activity = {
    activity_id: activityId,
    board_id: activityData.boardId,
    card_id: activityData.cardId || null,
    user_id: activityData.userId,
    action_type: activityData.actionType,
    old_value: activityData.oldValue || null,
    new_value: activityData.newValue || null,
    metadata: activityData.metadata || {},
    created_at: getCurrentTimestamp()
  };

  const { data, error } = await supabase
    .from('barista_activity_log')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getActivityByBoard = async (boardId, limit = 50) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_activity_log')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// ===========================================
// BOARD MEMBER OPERATIONS
// ===========================================

export const addBoardMember = async (boardId, userId, role = 'viewer') => {
  const supabase = getSupabase();
  
  // Default permissions based on role
  const rolePermissions = {
    owner: { canMoveCards: true, canEditFields: true, canComment: true, canLinkBuilds: true, canManageBoard: true },
    producer: { canMoveCards: true, canEditFields: true, canComment: true, canLinkBuilds: true, canManageBoard: false },
    developer: { canMoveCards: true, canEditFields: true, canComment: true, canLinkBuilds: true, canManageBoard: false },
    artist: { canMoveCards: false, canEditFields: true, canComment: true, canLinkBuilds: false, canManageBoard: false },
    qa: { canMoveCards: true, canEditFields: false, canComment: true, canLinkBuilds: false, canManageBoard: false },
    viewer: { canMoveCards: false, canEditFields: false, canComment: true, canLinkBuilds: false, canManageBoard: false }
  };

  const member = {
    board_id: boardId,
    user_id: userId,
    role,
    permissions: rolePermissions[role] || rolePermissions.viewer,
    joined_at: getCurrentTimestamp()
  };

  const { data, error } = await supabase
    .from('barista_board_members')
    .upsert(member, { onConflict: 'board_id,user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBoardMembers = async (boardId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('barista_board_members')
    .select('*, users(*)')
    .eq('board_id', boardId);

  if (error) throw error;
  return data;
};
