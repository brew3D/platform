// Stub: AWS removed; use Supabase or external service for GDPR delete
import { getSupabaseAdmin } from './supabase.js';

export async function deleteUserAndData(userId) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from('users').delete().eq('id', userId);
  // Extend: delete related rows in other tables as needed
}
