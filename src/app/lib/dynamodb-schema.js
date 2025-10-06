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
  COMMUNITY_POSTS: 'ruchi-ai-community-posts',
  EVENTS: 'ruchi-ai-events',
  EVENT_RSVPS: 'ruchi-ai-event-rsvps',
  BADGES: 'ruchi-ai-badges',
  USER_BADGES: 'ruchi-ai-user-badges',
  USER_POINTS: 'ruchi-ai-user-points',
  LEADERBOARDS: 'ruchi-ai-leaderboards'
};

export const GSI_NAMES = {
  USER_EMAIL: 'email-index',
  PROJECT_USER: 'user-id-index',
  SCENE_PROJECT: 'project-id-index',
  MAP_PROJECT: 'project-id-index',
  CHARACTER_PROJECT: 'project-id-index',
  ASSET_CATEGORY: 'category-index',
  TUTORIAL_CATEGORY: 'category-index',
  POST_USER: 'user-id-index',
  EVENT_DATE: 'event-date-index',
  EVENT_ORGANIZER: 'organizer-id-index',
  RSVP_EVENT: 'event-id-index',
  RSVP_USER: 'user-id-index',
  BADGE_CATEGORY: 'category-index',
  USER_BADGE_USER: 'user-id-index',
  USER_BADGE_BADGE: 'badge-id-index',
  USER_POINTS_USER: 'user-id-index',
  LEADERBOARD_TYPE: 'type-index'
};

// User Schema
export const USER_SCHEMA = {
  // Primary Key
  userId: 'S', // PK: user-{uuid}
  
  // Attributes
  email: 'S', // GSI: email-index
  name: 'S',
  passwordHash: 'S',
  role: 'S', // 'admin' | 'moderator' | 'member' | 'guest'
  profilePicture: 'S', // URL
  security: 'M', // 2FA and related settings
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

// Event Schema
export const EVENT_SCHEMA = {
  // Primary Key
  eventId: 'S', // PK: event-{uuid}
  
  // Attributes
  title: 'S',
  description: 'S',
  organizerId: 'S', // GSI: organizer-id-index
  eventDate: 'S', // GSI: event-date-index (ISO timestamp)
  startTime: 'S', // ISO timestamp
  endTime: 'S', // ISO timestamp
  location: 'M', // Location object
  category: 'S', // 'workshop' | 'meetup' | 'conference' | 'social' | 'other'
  type: 'S', // 'online' | 'in-person' | 'hybrid'
  maxAttendees: 'N', // Maximum number of attendees
  currentAttendees: 'N', // Current number of RSVPs
  price: 'N', // Price in cents (0 for free)
  currency: 'S', // 'USD' | 'EUR' | etc.
  tags: 'L', // List of tags
  requirements: 'L', // List of requirements
  resources: 'L', // List of resource URLs
  status: 'S', // 'draft' | 'published' | 'cancelled' | 'completed'
  isPublic: 'BOOL', // Whether event is visible to all users
  allowWaitlist: 'BOOL', // Whether to allow waitlist when full
  registrationDeadline: 'S', // ISO timestamp
  reminderSettings: 'M', // Reminder notification settings
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Location Structure
  location: {
    name: 'S', // Venue name
    address: 'S', // Full address
    city: 'S',
    state: 'S',
    country: 'S',
    postalCode: 'S',
    coordinates: 'M', // { lat: number, lng: number }
    onlineLink: 'S', // For online events
    meetingId: 'S', // For video conferencing
    meetingPassword: 'S'
  },
  
  // Reminder Settings Structure
  reminderSettings: {
    emailReminders: 'BOOL',
    pushNotifications: 'BOOL',
    reminderTimes: 'L', // [24, 2, 1] hours before event
    customMessage: 'S'
  }
};

// Event RSVP Schema
export const EVENT_RSVP_SCHEMA = {
  // Primary Key (Composite)
  eventId: 'S', // PK: event-{uuid}
  userId: 'S', // SK: user-{uuid}
  
  // Attributes
  status: 'S', // 'attending' | 'not-attending' | 'maybe' | 'waitlist'
  rsvpDate: 'S', // ISO timestamp
  plusOnes: 'N', // Number of additional guests
  dietaryRestrictions: 'S', // Dietary restrictions or special needs
  notes: 'S', // Additional notes for organizer
  checkInTime: 'S', // ISO timestamp (when they actually attended)
  feedback: 'M', // Post-event feedback
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S' // ISO timestamp
};

// Badge Schema
export const BADGE_SCHEMA = {
  // Primary Key
  badgeId: 'S', // PK: badge-{uuid}
  
  // Attributes
  name: 'S',
  description: 'S',
  category: 'S', // GSI: category-index ('community', 'content', 'achievement', 'special')
  icon: 'S', // Icon URL or emoji
  color: 'S', // Badge color hex code
  rarity: 'S', // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  points: 'N', // Points awarded for earning this badge
  requirements: 'M', // Requirements to earn this badge
  isActive: 'BOOL', // Whether badge can be earned
  isSecret: 'BOOL', // Whether badge is hidden until earned
  maxEarners: 'N', // Maximum number of users who can earn this badge (null = unlimited)
  currentEarners: 'N', // Current number of users who have earned this badge
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Requirements Structure
  requirements: {
    type: 'S', // 'points', 'actions', 'milestone', 'custom'
    criteria: 'M', // Specific criteria based on type
    conditions: 'L' // List of conditions that must be met
  }
};

// User Badge Schema (Junction Table)
export const USER_BADGE_SCHEMA = {
  // Primary Key (Composite)
  userId: 'S', // PK: user-{uuid}
  badgeId: 'S', // SK: badge-{uuid}
  
  // Attributes
  earnedAt: 'S', // ISO timestamp when badge was earned
  progress: 'N', // Progress towards badge (0-100)
  metadata: 'M', // Additional metadata about how badge was earned
  isDisplayed: 'BOOL', // Whether user wants to display this badge
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S' // ISO timestamp
};

// User Points Schema
export const USER_POINTS_SCHEMA = {
  // Primary Key
  userId: 'S', // PK: user-{uuid}
  
  // Attributes
  totalPoints: 'N', // Total points earned
  level: 'N', // Current user level
  experience: 'N', // Current experience points
  experienceToNext: 'N', // Experience needed for next level
  pointsByCategory: 'M', // Points broken down by category
  lastEarnedAt: 'S', // ISO timestamp of last points earned
  streak: 'N', // Current streak count
  longestStreak: 'N', // Longest streak achieved
  achievements: 'L', // List of achievement IDs
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Points by Category Structure
  pointsByCategory: {
    community: 'N', // Points from community activities
    content: 'N', // Points from content creation
    events: 'N', // Points from event participation
    social: 'N', // Points from social interactions
    special: 'N' // Points from special achievements
  }
};

// Leaderboard Schema
export const LEADERBOARD_SCHEMA = {
  // Primary Key
  leaderboardId: 'S', // PK: leaderboard-{uuid}
  
  // Attributes
  name: 'S',
  description: 'S',
  type: 'S', // GSI: type-index ('points', 'badges', 'posts', 'events', 'custom')
  category: 'S', // Category for filtering
  timeRange: 'S', // 'all-time', 'monthly', 'weekly', 'daily'
  criteria: 'M', // Criteria for ranking
  isActive: 'BOOL', // Whether leaderboard is active
  isPublic: 'BOOL', // Whether leaderboard is visible to all users
  maxEntries: 'N', // Maximum number of entries to show
  refreshInterval: 'N', // How often to refresh (in minutes)
  lastUpdated: 'S', // ISO timestamp of last update
  entries: 'L', // List of leaderboard entries
  createdAt: 'S', // ISO timestamp
  updatedAt: 'S', // ISO timestamp
  
  // Criteria Structure
  criteria: {
    metric: 'S', // What to measure ('points', 'badges', 'posts', etc.)
    aggregation: 'S', // How to aggregate ('sum', 'count', 'max', 'avg')
    filters: 'M', // Additional filters to apply
    weight: 'N' // Weight for this criteria in multi-criteria leaderboards
  },
  
  // Leaderboard Entry Structure
  entries: [{
    rank: 'N', // Position in leaderboard
    userId: 'S', // User ID
    score: 'N', // Calculated score
    metadata: 'M', // Additional data for this entry
    lastUpdated: 'S' // When this entry was last updated
  }]
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
