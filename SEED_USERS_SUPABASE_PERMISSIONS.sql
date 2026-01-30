-- ===========================================
-- Seed Users: Supabase Permissions for Testing
-- ===========================================
-- Run this in Supabase SQL Editor so seed users (and any authenticated user)
-- can create and manage projects. RLS is set to permissive for projects.
-- ===========================================

-- Projects: allow all operations (for testing with seed users)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own projects" ON projects;
CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (true);

-- Users: allow read/update for profile (signin needs to read users by email)
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- Ensure seed users exist (run seed script first: npm run seed:users)
-- Then sign in with a seed user; projects will be stored under their user_id.
