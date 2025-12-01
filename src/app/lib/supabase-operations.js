// Supabase CRUD Operations
// This file replaces dynamodb-operations.js with Supabase equivalents
import { getSupabaseClient } from "./supabase.js";
import { 
  generateId, 
  getCurrentTimestamp,
  validateRequiredFields 
} from "./dynamodb-schema.js";

const supabase = getSupabaseClient();

// Helper to convert DynamoDB-style data to Supabase format
const toSupabaseFormat = (data) => {
  const converted = {};
  for (const [key, value] of Object.entries(data)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    converted[snakeKey] = value;
  }
  return converted;
};

// Helper to convert Supabase format back to camelCase
const fromSupabaseFormat = (data) => {
  if (!data) return null;
  const converted = {};
  for (const [key, value] of Object.entries(data)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = value;
  }
  return converted;
};

// ===== USER OPERATIONS =====

export const createUser = async (userData) => {
  const userId = generateId('user');
  const timestamp = getCurrentTimestamp();
  
  const user = {
    user_id: userId,
    email: userData.email,
    name: userData.name,
    password_hash: userData.passwordHash,
    role: userData.role || 'member',
    profile_picture: userData.profilePicture || '',
    security: {
      twoFactorEnabled: false,
      totpSecret: null,
      recoveryCodes: []
    },
    preferences: {
      theme: 'light',
      editorSettings: {},
      notifications: {
        email: true,
        platform: true,
        projectUpdates: false
      },
      language: 'en',
      timezone: 'UTC',
      defaultProjectSettings: {}
    },
    subscription: {
      plan: 'free',
      status: 'active',
      expiresAt: null,
      features: ['basic-editor', 'basic-assets']
    },
    created_at: timestamp,
    updated_at: timestamp,
    last_login_at: timestamp,
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }

    return { success: true, user: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return fromSupabaseFormat(data);
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return fromSupabaseFormat(data);
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, updateData) => {
  const timestamp = getCurrentTimestamp();
  
  const updatePayload = {
    ...toSupabaseFormat(updateData),
    updated_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

// ===== PROJECT OPERATIONS =====

export const createProject = async (projectData) => {
  const projectId = generateId('project');
  const timestamp = getCurrentTimestamp();
  
  const project = {
    project_id: projectId,
    name: projectData.name,
    description: projectData.description || '',
    user_id: projectData.userId,
    team_members: projectData.teamMembers || [],
    settings: {
      template: projectData.template || 'blank',
      gameType: projectData.gameType || 'platformer',
      platform: projectData.platform || 'web',
      collaboration: {
        allowComments: true,
        allowEdits: false,
        allowViewing: true
      },
      aiSettings: {
        autoSave: true,
        suggestions: true,
        codeCompletion: true
      }
    },
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
    last_accessed_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return { success: true, project: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return fromSupabaseFormat(data);
  } catch (error) {
    throw error;
  }
};

export const getUserProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (projectId, updateData) => {
  const timestamp = getCurrentTimestamp();
  
  const updatePayload = {
    ...toSupabaseFormat(updateData),
    updated_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, project: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// ===== SCENE OPERATIONS =====

export const createScene = async (sceneData) => {
  const sceneId = generateId('scene');
  const timestamp = getCurrentTimestamp();
  
  const scene = {
    scene_id: sceneId,
    project_id: sceneData.projectId,
    name: sceneData.name,
    description: sceneData.description || '',
    scene_data: sceneData.sceneData || {
      objects: [],
      lighting: {},
      camera: {},
      physics: {},
      scripts: [],
      metadata: {}
    },
    thumbnail: sceneData.thumbnail || '',
    order: sceneData.order || 0,
    is_published: false,
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('scenes')
      .insert(scene)
      .select()
      .single();

    if (error) throw error;
    return { success: true, scene: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectScenes = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

// ===== MAP OPERATIONS =====

export const createMap = async (mapData) => {
  const mapId = generateId('map');
  const timestamp = getCurrentTimestamp();
  
  const map = {
    map_id: mapId,
    project_id: mapData.projectId,
    name: mapData.name,
    description: mapData.description || '',
    map_data: mapData.mapData || {
      tiles: [],
      layers: [],
      objects: [],
      spawnPoints: [],
      metadata: {}
    },
    thumbnail: mapData.thumbnail || '',
    size: mapData.size || { width: 32, height: 32 },
    tileset: mapData.tileset || '',
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('maps')
      .insert(map)
      .select()
      .single();

    if (error) throw error;
    return { success: true, map: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectMaps = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

// ===== CHARACTER OPERATIONS =====

export const createCharacter = async (characterData) => {
  const characterId = generateId('character');
  const timestamp = getCurrentTimestamp();
  
  const character = {
    character_id: characterId,
    project_id: characterData.projectId,
    name: characterData.name,
    description: characterData.description || '',
    character_data: characterData.characterData || {
      model: '',
      animations: [],
      abilities: [],
      inventory: [],
      ai: {},
      metadata: {}
    },
    thumbnail: characterData.thumbnail || '',
    type: characterData.type || 'npc',
    stats: characterData.stats || {},
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single();

    if (error) throw error;
    return { success: true, character: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectCharacters = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

// ===== ASSET OPERATIONS =====

export const createAsset = async (assetData) => {
  const assetId = generateId('asset');
  const timestamp = getCurrentTimestamp();
  
  const asset = {
    asset_id: assetId,
    name: assetData.name,
    description: assetData.description || '',
    category: assetData.category,
    type: assetData.type,
    creator_id: assetData.creatorId,
    file_url: assetData.fileUrl,
    thumbnail: assetData.thumbnail || '',
    tags: assetData.tags || [],
    price: assetData.price || 0,
    is_free: assetData.isFree || false,
    download_count: 0,
    rating: 0,
    reviews: [],
    status: 'pending',
    created_at: timestamp,
    updated_at: timestamp,
    published_at: assetData.isFree ? timestamp : null
  };

  try {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return { success: true, asset: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getAssetsByCategory = async (category, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

// ===== UTILITY FUNCTIONS =====

export const batchGetItems = async (tableName, keys) => {
  try {
    // Extract the primary key field name
    const primaryKey = tableName === 'users' ? 'user_id' : 
                      tableName === 'projects' ? 'project_id' :
                      tableName === 'scenes' ? 'scene_id' :
                      tableName === 'maps' ? 'map_id' :
                      tableName === 'characters' ? 'character_id' :
                      tableName === 'assets' ? 'asset_id' : 'id';

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in(primaryKey, keys.map(k => k[primaryKey] || k));

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const scanTable = async (tableName, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

