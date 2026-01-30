-- ===========================================
-- Remove Chat Feature from Supabase
-- ===========================================
-- Run this in Supabase SQL Editor to drop chat-related tables,
-- triggers, and functions. Order matters (drop FKs first).
-- ===========================================

-- Drop trigger that updates chats on new messages (depends on messages)
DROP TRIGGER IF EXISTS update_chat_last_message_trigger ON messages;

-- Drop function used by that trigger
DROP FUNCTION IF EXISTS update_chat_last_message();

-- Drop trigger on chats table
DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;

-- Drop RLS policies on messages and chats (if any)
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can read own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

-- Drop tables (messages first due to FK to chats)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
