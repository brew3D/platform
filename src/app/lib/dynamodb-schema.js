// DynamoDB Table Schema and Data Models
// This file defines the structure for all DynamoDB tables

export const TABLE_NAMES = {
  USERS: 'ruchi-ai-users',
  SCENES: 'ruchi-ai-scenes',
  PROJECTS: 'ruchi-ai-projects',
  MAPS: 'ruchi-ai-maps',
  CHARACTERS: 'ruchi-ai-characters',
  ASSETS: 'ruchi-ai-assets',
  TUTORIALS: 'ruchi-ai-tutorials',
  COMMUNITY_POSTS: 'ruchi-ai-community-posts'
};

export const GSI_NAMES = {
  USER_EMAIL: 'email-index',
  PROJECT_USER: 'user-id-index',
  SCENE_PROJECT: 'project-id-index',
  MAP_PROJECT: 'project-id-index',
  CHARACTER_PROJECT: 'project-id-index',
  ASSET_CATEGORY: 'category-index',
  TUTORIAL_CATEGORY: 'category-index',
  POST_USER: 'user-id-index'
};

// User Schema
export const USER_SCHEMA = {
  // Primary Key
  userId: 'S', // PK: user-{uuid}
  
  // Attributes
  email: 'S', // GSI: email-index
  name: 'S',
  passwordHash: 'S',
  profilePicture: 'S', // URL
  preferences: 'M', // Nested object for user preferences
  subscription: 'M', // Subscription details
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  lastLoginAt: 'S', // ISO timestamp
  isActive: 'BOOL',
  
  // User Preferences Structure
  preferences: {
    theme: 'S', // 'light' | 'dark' | 'auto'
    editorSettings: 'M', // Editor-specific preferences
    notifications: 'M', // Notification preferences
    language: 'S', // 'en' | 'es' | etc.
    timezone: 'S', // 'UTC' | 'America/New_York' | etc.
    defaultProjectSettings: 'M' // Default settings for new projects
  },
  
  // Subscription Structure
  subscription: {
    plan: 'S', // 'free' | 'pro' | 'enterprise'
    status: 'S', // 'active' | 'cancelled' | 'expired'
    expiresAt: 'S', // ISO timestamp
    features: 'L' // List of enabled features
  }
};

// Project Schema
export const PROJECT_SCHEMA = {
  // Primary Key
  projectId: 'S', // PK: project-{uuid}
  
  // Attributes
  name: 'S',
  description: 'S',
  userId: 'S', // GSI: user-id-index (owner)
  teamMembers: 'L', // List of user IDs
  settings: 'M', // Project-specific settings
  status: 'S', // 'active' | 'archived' | 'deleted'
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  lastAccessedAt: 'S', // ISO timestamp
  
  // Project Settings Structure
  settings: {
    template: 'S', // Template used for this project
    gameType: 'S', // 'platformer' | 'rpg' | 'fps' | etc.
    platform: 'S', // 'web' | 'mobile' | 'desktop'
    collaboration: 'M', // Collaboration settings
    aiSettings: 'M' // AI assistance settings
  }
};

// Scene Schema
export const SCENE_SCHEMA = {
  // Primary Key
  sceneId: 'S', // PK: scene-{uuid}
  
  // Attributes
  projectId: 'S', // GSI: project-id-index
  name: 'S',
  description: 'S',
  sceneData: 'M', // The actual scene configuration
  thumbnail: 'S', // URL to thumbnail image
  order: 'N', // Order within project
  isPublished: 'BOOL',
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Scene Data Structure
  sceneData: {
    objects: 'L', // List of 3D objects in the scene
    lighting: 'M', // Lighting configuration
    camera: 'M', // Camera settings
    physics: 'M', // Physics settings
    scripts: 'L', // Associated scripts
    metadata: 'M' // Additional scene metadata
  }
};

// Map Schema
export const MAP_SCHEMA = {
  // Primary Key
  mapId: 'S', // PK: map-{uuid}
  
  // Attributes
  projectId: 'S', // GSI: project-id-index
  name: 'S',
  description: 'S',
  mapData: 'M', // The actual map configuration
  thumbnail: 'S', // URL to thumbnail image
  size: 'M', // Map dimensions
  tileset: 'S', // Tileset reference
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Map Data Structure
  mapData: {
    tiles: 'L', // 2D array of tile data
    layers: 'L', // Multiple map layers
    objects: 'L', // Objects placed on the map
    spawnPoints: 'L', // Player spawn locations
    metadata: 'M' // Additional map metadata
  }
};

// Character Schema
export const CHARACTER_SCHEMA = {
  // Primary Key
  characterId: 'S', // PK: character-{uuid}
  
  // Attributes
  projectId: 'S', // GSI: project-id-index
  name: 'S',
  description: 'S',
  characterData: 'M', // The actual character configuration
  thumbnail: 'S', // URL to thumbnail image
  type: 'S', // 'player' | 'npc' | 'enemy' | 'item'
  stats: 'M', // Character statistics
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Character Data Structure
  characterData: {
    model: 'S', // 3D model reference
    animations: 'L', // Available animations
    abilities: 'L', // Character abilities
    inventory: 'L', // Character inventory
    ai: 'M', // AI behavior settings
    metadata: 'M' // Additional character metadata
  }
};

// Asset Schema
export const ASSET_SCHEMA = {
  // Primary Key
  assetId: 'S', // PK: asset-{uuid}
  
  // Attributes
  name: 'S',
  description: 'S',
  category: 'S', // GSI: category-index
  type: 'S', // '3d-model' | 'texture' | 'sound' | 'script'
  creatorId: 'S', // User who created the asset
  fileUrl: 'S', // URL to the asset file
  thumbnail: 'S', // URL to thumbnail
  tags: 'L', // List of tags
  price: 'N', // Price in cents
  isFree: 'BOOL',
  downloadCount: 'N',
  rating: 'N', // Average rating
  reviews: 'L', // List of reviews
  status: 'S', // 'pending' | 'approved' | 'rejected'
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  publishedAt: 'S' // ISO timestamp
};

// Tutorial Schema
export const TUTORIAL_SCHEMA = {
  // Primary Key
  tutorialId: 'S', // PK: tutorial-{uuid}
  
  // Attributes
  title: 'S',
  description: 'S',
  category: 'S', // GSI: category-index
  difficulty: 'S', // 'beginner' | 'intermediate' | 'advanced'
  duration: 'N', // Duration in seconds
  videoUrl: 'S', // URL to video
  thumbnail: 'S', // URL to thumbnail
  creatorId: 'S', // User who created the tutorial
  viewCount: 'N',
  likeCount: 'N',
  tags: 'L', // List of tags
  isPublished: 'BOOL',
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  publishedAt: 'S' // ISO timestamp
};

// Community Post Schema
export const COMMUNITY_POST_SCHEMA = {
  // Primary Key
  postId: 'S', // PK: post-{uuid}
  
  // Attributes
  userId: 'S', // GSI: user-id-index
  content: 'S',
  type: 'S', // 'text' | 'image' | 'video' | 'tutorial'
  attachments: 'L', // List of attachment URLs
  likes: 'L', // List of user IDs who liked
  comments: 'L', // List of comment objects
  shares: 'N', // Share count
  tags: 'L', // List of tags
  isPinned: 'BOOL',
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S' // ISO timestamp
};

// Helper function to generate IDs
export const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get current timestamp
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// Helper function to validate required fields
export const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  return true;
};
