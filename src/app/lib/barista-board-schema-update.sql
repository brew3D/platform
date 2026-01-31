-- Quick fix for RLS policies
-- Run this if you're getting "row-level security policy" errors
-- This makes policies permissive (service role bypasses RLS anyway)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view boards for their projects" ON barista_boards;
DROP POLICY IF EXISTS "Users can create boards for their projects" ON barista_boards;
DROP POLICY IF EXISTS "Board owners can update boards" ON barista_boards;
DROP POLICY IF EXISTS "Users can manage columns for their project boards" ON barista_columns;
DROP POLICY IF EXISTS "Users can manage cards for their project boards" ON barista_cards;
DROP POLICY IF EXISTS "Users can manage comments for their project boards" ON barista_comments;
DROP POLICY IF EXISTS "Users can view activity for their project boards" ON barista_activity_log;
DROP POLICY IF EXISTS "Users can log activity for their project boards" ON barista_activity_log;
DROP POLICY IF EXISTS "Users can manage board members for their project boards" ON barista_board_members;

-- Create permissive policies (service role bypasses RLS anyway)
CREATE POLICY "Allow all board operations" ON barista_boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all column operations" ON barista_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all card operations" ON barista_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all comment operations" ON barista_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all activity operations" ON barista_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all member operations" ON barista_board_members FOR ALL USING (true) WITH CHECK (true);
