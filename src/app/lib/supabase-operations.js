// Supabase CRUD Operations
// This file replaces dynamodb-operations.js with Supabase equivalents
import { getSupabaseAdmin } from "./supabase.js";
import { 
  generateId, 
  getCurrentTimestamp,
  validateRequiredFields 
} from "./dynamodb-schema.js";

// Initialize Supabase admin client lazily (uses service role key, bypasses RLS)
let supabaseInstance = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = getSupabaseAdmin();
    } catch (error) {
      console.error('Failed to initialize Supabase admin client:', error);
      throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON) environment variables.');
    }
  }
  return supabaseInstance;
};

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
    // Handle cases like: password_hash -> passwordHash, is_active -> isActive, user_id -> userId
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    // Handle nested JSONB objects - they should already be objects, so keep them as-is
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Check if it's a JSONB object (like security, preferences, subscription)
      // These are already in camelCase from Supabase, so keep them as-is
      converted[camelKey] = value;
    } else {
      converted[camelKey] = value;
    }
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
  
  // Handle test projects for temporary users
  const isTestProject = projectData.isTest || projectData.userId === 'temp-user-default' || projectData.userId?.startsWith('temp-user');
  const projectName = isTestProject && !projectData.name.startsWith('[TEST]') 
    ? `[TEST] ${projectData.name}` 
    : projectData.name;
  
  const project = {
    project_id: projectId,
    name: projectName,
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
      },
      isTest: isTestProject
    },
    status: 'active',
    engine_type: projectData.engineType || 'unreal',
    engine_version: projectData.engineVersion || '',
    repo_url: projectData.repoUrl || '',
    default_branch: projectData.defaultBranch || 'main',
    created_at: timestamp,
    updated_at: timestamp,
    last_accessed_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    return { success: true, project: fromSupabaseFormat(data) };
  } catch (error) {
    console.error('createProject error:', error);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
  
  // Handle nested objects like settings - don't convert keys inside JSONB fields
  const updatePayload = {
    updated_at: timestamp
  };
  
  // Convert top-level fields
  for (const [key, value] of Object.entries(updateData)) {
    if (key === 'settings' && typeof value === 'object') {
      // Keep settings as-is (it's a JSONB field)
      updatePayload.settings = value;
    } else {
      // Convert camelCase to snake_case for other fields
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updatePayload[snakeKey] = value;
    }
  }

  console.log('Update payload:', JSON.stringify(updatePayload, null, 2));

  try {
    const { data, error } = await getSupabase()
      .from('projects')
      .update(updatePayload)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    return { success: true, project: fromSupabaseFormat(data) };
  } catch (error) {
    console.error('updateProject error:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const { error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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

// ===== FLOW OPERATIONS =====

export const createFlow = async (projectId, { name = "Main Flow", metadata = {} } = {}) => {
  const flowId = generateId("flow");
  const timestamp = getCurrentTimestamp();

  const flow = {
    flow_id: flowId,
    project_id: projectId,
    name,
    metadata,
    created_at: timestamp,
    updated_at: timestamp,
  };

  try {
    const { data, error } = await getSupabase()
      .from("project_flows")
      .insert(flow)
      .select("*")
      .single();

    if (error) throw error;
    return { success: true, flow: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectFlows = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from("project_flows")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const getFlowWithNodesAndEdges = async (flowId) => {
  try {
    const supabase = getSupabase();

    const [{ data: flowData, error: flowError }, { data: nodesData, error: nodesError }, { data: edgesData, error: edgesError }, { data: startData, error: startError }] =
      await Promise.all([
        supabase.from("project_flows").select("*").eq("flow_id", flowId).single(),
        supabase.from("flow_nodes").select("*").eq("flow_id", flowId),
        supabase.from("flow_edges").select("*").eq("flow_id", flowId),
        supabase.from("flow_startpoints").select("*").eq("flow_id", flowId).maybeSingle(),
      ]);

    if (flowError) throw flowError;
    if (nodesError) throw nodesError;
    if (edgesError) throw edgesError;
    if (startError) throw startError;

    return {
      flow: fromSupabaseFormat(flowData),
      nodes: (nodesData || []).map(fromSupabaseFormat),
      edges: (edgesData || []).map(fromSupabaseFormat),
      startpoint: startData ? fromSupabaseFormat(startData) : null,
    };
  } catch (error) {
    throw error;
  }
};

export const upsertFlowNodesAndEdges = async (flowId, projectId, { nodes, edges, startNodeId }) => {
  const supabase = getSupabase();

  try {
    // Delete existing edges and nodes for this flow
    const { error: deleteEdgesError } = await supabase
      .from("flow_edges")
      .delete()
      .eq("flow_id", flowId);
    if (deleteEdgesError) throw deleteEdgesError;

    const { error: deleteNodesError } = await supabase
      .from("flow_nodes")
      .delete()
      .eq("flow_id", flowId);
    if (deleteNodesError) throw deleteNodesError;

    // Insert nodes
    if (nodes && nodes.length > 0) {
      const nodeRows = nodes.map((n) => ({
        node_id: n.nodeId || n.id,
        flow_id: flowId,
        project_id: projectId,
        label: n.label || n.name || "Untitled",
        node_type: n.nodeType || "level",
        engine_level_name: n.engineLevelName || null,
        unity_scene_name: n.unitySceneName || null,
        map_id: n.mapId || null,
        layout: {
          x: n.x ?? 0,
          y: n.y ?? 0,
        },
        metadata: n.metadata || {},
      }));

      const { error: insertNodesError } = await supabase
        .from("flow_nodes")
        .insert(nodeRows);
      if (insertNodesError) throw insertNodesError;
    }

    // Insert edges
    if (edges && edges.length > 0) {
      const edgeRows = edges.map((e) => ({
        edge_id: e.edgeId || e.id || generateId("edge"),
        flow_id: flowId,
        from_node_id: e.fromNodeId || e.fromId,
        to_node_id: e.toNodeId || e.toId,
        metadata: e.metadata || {},
      }));

      const { error: insertEdgesError } = await supabase
        .from("flow_edges")
        .insert(edgeRows);
      if (insertEdgesError) throw insertEdgesError;
    }

    // Upsert startpoint
    if (startNodeId) {
      const { error: upsertStartError } = await supabase
        .from("flow_startpoints")
        .upsert(
          {
            flow_id: flowId,
            start_node_id: startNodeId,
          },
          { onConflict: "flow_id" }
        );
      if (upsertStartError) throw upsertStartError;
    } else {
      // Clear startpoint if none provided
      const { error: deleteStartError } = await supabase
        .from("flow_startpoints")
        .delete()
        .eq("flow_id", flowId);
      if (deleteStartError) throw deleteStartError;
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

// ===== SCRIPT OPERATIONS =====

export const createScript = async (scriptData) => {
  const scriptId = scriptData.scriptId || generateId('script');
  const timestamp = getCurrentTimestamp();
  
  const script = {
    script_id: scriptId,
    project_id: scriptData.projectId,
    map_id: scriptData.mapId || null,
    name: scriptData.name || 'Untitled Script',
    code: scriptData.code || '',
    elements: scriptData.elements || [],
    metadata: scriptData.metadata || {},
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('scripts')
      .insert(toSupabaseFormat(script))
      .select()
      .single();

    if (error) throw error;
    return { success: true, script: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const updateScript = async (scriptId, scriptData) => {
  const timestamp = getCurrentTimestamp();
  
  const updates = {
    ...scriptData,
    script_id: scriptId,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('scripts')
      .update(toSupabaseFormat(updates))
      .eq('script_id', scriptId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, script: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getScript = async (scriptId) => {
  try {
    const { data, error } = await getSupabase()
      .from('scripts')
      .select('*')
      .eq('script_id', scriptId)
      .single();

    if (error) throw error;
    return fromSupabaseFormat(data);
  } catch (error) {
    throw error;
  }
};

export const getMapScripts = async (mapId) => {
  try {
    const { data, error } = await getSupabase()
      .from('scripts')
      .select('*')
      .eq('map_id', mapId)
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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

// ===== PROJECT ASSET OPERATIONS =====

export const createProjectAsset = async (assetData) => {
  const assetId = generateId('project_asset');
  const timestamp = getCurrentTimestamp();
  
  const asset = {
    project_asset_id: assetId,
    project_id: assetData.projectId,
    asset_id: assetData.assetId || null,
    name: assetData.name,
    type: assetData.type,
    source: assetData.source || 'engine',
    engine_path: assetData.enginePath || '',
    license: assetData.license || '',
    tags: assetData.tags || [],
    metadata: assetData.metadata || {},
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('project_assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return { success: true, asset: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectAssets = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const getProjectAssetsByType = async (projectId, type) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const linkAssetToFlowNode = async (nodeId, projectAssetId) => {
  try {
    const { data, error } = await getSupabase()
      .from('flow_node_assets')
      .insert({
        node_id: nodeId,
        project_asset_id: projectAssetId,
        created_at: getCurrentTimestamp()
      })
      .select()
      .single();

    if (error) {
      // If already exists, that's fine
      if (error.code === '23505') {
        return { success: true, link: null };
      }
      throw error;
    }
    return { success: true, link: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const unlinkAssetFromFlowNode = async (nodeId, projectAssetId) => {
  try {
    const { error } = await getSupabase()
      .from('flow_node_assets')
      .delete()
      .eq('node_id', nodeId)
      .eq('project_asset_id', projectAssetId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const getAssetsForFlowNode = async (nodeId) => {
  try {
    const { data, error } = await getSupabase()
      .from('flow_node_assets')
      .select(`
        project_asset_id,
        project_assets (*)
      `)
      .eq('node_id', nodeId);

    if (error) throw error;
    return (data || []).map(item => ({
      ...fromSupabaseFormat(item.project_assets),
      linkId: item.project_asset_id
    }));
  } catch (error) {
    throw error;
  }
};

// ===== ENGINE PREVIEW OPERATIONS =====

export const createEnginePreview = async (previewData) => {
  const previewId = generateId('preview');
  const timestamp = getCurrentTimestamp();
  
  const preview = {
    preview_id: previewId,
    project_id: previewData.projectId,
    engine_type: previewData.engineType || 'unreal',
    commit_sha: previewData.commitSha || '',
    status: 'queued',
    stream_url: '',
    logs: previewData.logs || {},
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('engine_previews')
      .insert(preview)
      .select()
      .single();

    if (error) throw error;
    return { success: true, preview: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectPreviews = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from('engine_previews')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const updateEnginePreview = async (previewId, updates) => {
  const timestamp = getCurrentTimestamp();
  
  const updatePayload = {
    ...toSupabaseFormat(updates),
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('engine_previews')
      .update(updatePayload)
      .eq('preview_id', previewId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, preview: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

// ===== BUILD OPERATIONS =====

export const createBuild = async (buildData) => {
  const buildId = generateId('build');
  const timestamp = getCurrentTimestamp();
  
  const build = {
    build_id: buildId,
    project_id: buildData.projectId,
    engine_type: buildData.engineType || 'unreal',
    commit_sha: buildData.commitSha || '',
    status: 'queued',
    logs: buildData.logs || '',
    artifacts: buildData.artifacts || {},
    trigger: buildData.trigger || 'manual',
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('builds')
      .insert(build)
      .select()
      .single();

    if (error) throw error;
    return { success: true, build: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectBuilds = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from('builds')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const updateBuild = async (buildId, updates) => {
  const timestamp = getCurrentTimestamp();
  
  const updatePayload = {
    ...toSupabaseFormat(updates),
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('builds')
      .update(updatePayload)
      .eq('build_id', buildId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, build: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

// ===== PROJECT DOCS OPERATIONS =====

export const createProjectDoc = async (docData) => {
  const docId = generateId('doc');
  const timestamp = getCurrentTimestamp();
  
  const doc = {
    doc_id: docId,
    project_id: docData.projectId,
    title: docData.title,
    content: docData.content || '',
    links: docData.links || {},
    created_at: timestamp,
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('project_docs')
      .insert(doc)
      .select()
      .single();

    if (error) throw error;
    return { success: true, doc: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectDocs = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_docs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const getProjectDoc = async (docId) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_docs')
      .select('*')
      .eq('doc_id', docId)
      .single();

    if (error) throw error;
    return fromSupabaseFormat(data);
  } catch (error) {
    throw error;
  }
};

export const updateProjectDoc = async (docId, updates) => {
  const timestamp = getCurrentTimestamp();
  
  const updatePayload = {
    ...toSupabaseFormat(updates),
    updated_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('project_docs')
      .update(updatePayload)
      .eq('doc_id', docId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, doc: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const deleteProjectDoc = async (docId) => {
  try {
    const { error } = await getSupabase()
      .from('project_docs')
      .delete()
      .eq('doc_id', docId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// ===== PROJECT SNAPSHOT OPERATIONS =====

export const createProjectSnapshot = async (snapshotData) => {
  const snapshotId = generateId('snapshot');
  const timestamp = getCurrentTimestamp();
  
  const snapshot = {
    snapshot_id: snapshotId,
    project_id: snapshotData.projectId,
    label: snapshotData.label,
    commit_sha: snapshotData.commitSha || '',
    snapshot_data: snapshotData.snapshotData || {},
    created_at: timestamp
  };

  try {
    const { data, error } = await getSupabase()
      .from('project_snapshots')
      .insert(snapshot)
      .select()
      .single();

    if (error) throw error;
    return { success: true, snapshot: fromSupabaseFormat(data) };
  } catch (error) {
    throw error;
  }
};

export const getProjectSnapshots = async (projectId) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

export const getProjectSnapshot = async (snapshotId) => {
  try {
    const { data, error } = await getSupabase()
      .from('project_snapshots')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .single();

    if (error) throw error;
    return fromSupabaseFormat(data);
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

    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) throw error;
    return (data || []).map(fromSupabaseFormat);
  } catch (error) {
    throw error;
  }
};

