// DynamoDB CRUD Operations
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";
import { getDynamoDocClient } from "./dynamodb.js";
import { 
  TABLE_NAMES, 
  GSI_NAMES, 
  generateId, 
  getCurrentTimestamp,
  validateRequiredFields 
} from "./dynamodb-schema.js";

const docClient = getDynamoDocClient();

// ===== USER OPERATIONS =====

export const createUser = async (userData) => {
  const userId = generateId('user');
  const timestamp = getCurrentTimestamp();
  
  const user = {
    userId,
    email: userData.email,
    name: userData.name,
    passwordHash: userData.passwordHash,
    profilePicture: userData.profilePicture || '',
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
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: timestamp,
    isActive: true
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)'
    }));
    return { success: true, user };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId }
    }));
    return result.Item || null;
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.USERS,
      IndexName: GSI_NAMES.USER_EMAIL,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));
    return result.Items?.[0] || null;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, updateData) => {
  const timestamp = getCurrentTimestamp();
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Build update expression dynamically
  Object.keys(updateData).forEach((key, index) => {
    const nameKey = `#attr${index}`;
    const valueKey = `:val${index}`;
    
    updateExpressions.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = updateData[key];
  });

  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = timestamp;

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    return { success: true, user: result.Attributes };
  } catch (error) {
    throw error;
  }
};

// ===== PROJECT OPERATIONS =====

export const createProject = async (projectData) => {
  const projectId = generateId('project');
  const timestamp = getCurrentTimestamp();
  
  const project = {
    projectId,
    name: projectData.name,
    description: projectData.description || '',
    userId: projectData.userId,
    teamMembers: projectData.teamMembers || [],
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
    createdAt: timestamp,
    updatedAt: timestamp,
    lastAccessedAt: timestamp
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.PROJECTS,
      Item: project
    }));
    return { success: true, project };
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.PROJECTS,
      Key: { projectId }
    }));
    return result.Item || null;
  } catch (error) {
    throw error;
  }
};

export const getUserProjects = async (userId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.PROJECTS,
      IndexName: GSI_NAMES.PROJECT_USER,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Sort by creation time descending
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (projectId, updateData) => {
  const timestamp = getCurrentTimestamp();
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updateData).forEach((key, index) => {
    const nameKey = `#attr${index}`;
    const valueKey = `:val${index}`;
    
    updateExpressions.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = updateData[key];
  });

  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = timestamp;

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.PROJECTS,
      Key: { projectId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    return { success: true, project: result.Attributes };
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.PROJECTS,
      Key: { projectId }
    }));
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
    sceneId,
    projectId: sceneData.projectId,
    name: sceneData.name,
    description: sceneData.description || '',
    sceneData: sceneData.sceneData || {
      objects: [],
      lighting: {},
      camera: {},
      physics: {},
      scripts: [],
      metadata: {}
    },
    thumbnail: sceneData.thumbnail || '',
    order: sceneData.order || 0,
    isPublished: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.SCENES,
      Item: scene
    }));
    return { success: true, scene };
  } catch (error) {
    throw error;
  }
};

export const getProjectScenes = async (projectId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.SCENES,
      IndexName: GSI_NAMES.SCENE_PROJECT,
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      },
      ScanIndexForward: true // Sort by order ascending
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};

// ===== MAP OPERATIONS =====

export const createMap = async (mapData) => {
  const mapId = generateId('map');
  const timestamp = getCurrentTimestamp();
  
  const map = {
    mapId,
    projectId: mapData.projectId,
    name: mapData.name,
    description: mapData.description || '',
    mapData: mapData.mapData || {
      tiles: [],
      layers: [],
      objects: [],
      spawnPoints: [],
      metadata: {}
    },
    thumbnail: mapData.thumbnail || '',
    size: mapData.size || { width: 32, height: 32 },
    tileset: mapData.tileset || '',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MAPS,
      Item: map
    }));
    return { success: true, map };
  } catch (error) {
    throw error;
  }
};

export const getProjectMaps = async (projectId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MAPS,
      IndexName: GSI_NAMES.MAP_PROJECT,
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      }
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};

// ===== CHARACTER OPERATIONS =====

export const createCharacter = async (characterData) => {
  const characterId = generateId('character');
  const timestamp = getCurrentTimestamp();
  
  const character = {
    characterId,
    projectId: characterData.projectId,
    name: characterData.name,
    description: characterData.description || '',
    characterData: characterData.characterData || {
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
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.CHARACTERS,
      Item: character
    }));
    return { success: true, character };
  } catch (error) {
    throw error;
  }
};

export const getProjectCharacters = async (projectId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.CHARACTERS,
      IndexName: GSI_NAMES.CHARACTER_PROJECT,
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      }
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};

// ===== ASSET OPERATIONS =====

export const createAsset = async (assetData) => {
  const assetId = generateId('asset');
  const timestamp = getCurrentTimestamp();
  
  const asset = {
    assetId,
    name: assetData.name,
    description: assetData.description || '',
    category: assetData.category,
    type: assetData.type,
    creatorId: assetData.creatorId,
    fileUrl: assetData.fileUrl,
    thumbnail: assetData.thumbnail || '',
    tags: assetData.tags || [],
    price: assetData.price || 0,
    isFree: assetData.isFree || false,
    downloadCount: 0,
    rating: 0,
    reviews: [],
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: assetData.isFree ? timestamp : null
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.ASSETS,
      Item: asset
    }));
    return { success: true, asset };
  } catch (error) {
    throw error;
  }
};

export const getAssetsByCategory = async (category, limit = 20) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.ASSETS,
      IndexName: GSI_NAMES.ASSET_CATEGORY,
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category
      },
      Limit: limit,
      ScanIndexForward: false // Sort by creation time descending
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};

// ===== UTILITY FUNCTIONS =====

export const batchGetItems = async (tableName, keys) => {
  try {
    const result = await docClient.send(new BatchGetCommand({
      RequestItems: {
        [tableName]: {
          Keys: keys
        }
      }
    }));
    return result.Responses[tableName] || [];
  } catch (error) {
    throw error;
  }
};

export const scanTable = async (tableName, limit = 100) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      Limit: limit
    }));
    return result.Items || [];
  } catch (error) {
    throw error;
  }
};
