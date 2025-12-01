-- Fix RLS Policies for INSERT Operations
-- Run this in your Supabase SQL Editor to allow user signup and project creation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;

-- Create new policies that allow INSERT operations
-- Note: Using 'true' allows all operations since we're using JWT auth (not Supabase Auth)

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can delete own data" ON users FOR DELETE USING (true);

-- Projects policies
CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (true);

-- Add policies for other commonly used tables
CREATE POLICY IF NOT EXISTS "Users can insert scenes" ON scenes FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert maps" ON maps FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert characters" ON characters FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert community posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert event rsvps" ON event_rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert chats" ON chats FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert presence" ON presence FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert logs" ON logs FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert highlights" ON highlights FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert webhooks" ON webhooks FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert user points" ON user_points FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can insert user badges" ON user_badges FOR INSERT WITH CHECK (true);

