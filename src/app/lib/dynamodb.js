// Legacy DynamoDB client - now uses Supabase
// This file is kept for backward compatibility
import { getSupabaseClient } from "./supabase.js";

let cachedDocClient = null;

export function getDynamoDocClient() {
  // Return Supabase client for backward compatibility
  if (cachedDocClient) return cachedDocClient;
  cachedDocClient = getSupabaseClient();
  return cachedDocClient;
}

export function getScenesTableName() {
  // Return Supabase table name
  return "scenes";
}


