// DynamoDB CRUD Operations
// This file now uses Supabase instead of DynamoDB
// Re-exporting from supabase-operations for backward compatibility
export {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  createScene,
  getProjectScenes,
  createMap,
  getProjectMaps,
  createCharacter,
  getProjectCharacters,
  createAsset,
  getAssetsByCategory,
  batchGetItems,
  scanTable
} from "./supabase-operations.js";

// Keep these exports for backward compatibility
export { generateId, getCurrentTimestamp, validateRequiredFields } from "./dynamodb-schema.js";
