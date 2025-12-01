import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON are required');
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export function getSupabaseAdmin() {
  // For admin operations, you might want to use service role key
  // For now, using the same client
  return getSupabaseClient();
}

