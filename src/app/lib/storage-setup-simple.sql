-- SIMPLE Supabase Storage Setup for Avatars
-- This version uses more permissive policies to ensure uploads work
-- Run this SQL in Supabase SQL Editor

-- Step 1: Make sure the bucket exists and is PUBLIC
-- Go to Dashboard > Storage > avatars bucket > Settings
-- Enable "Public bucket" checkbox

-- Step 2: Drop ALL existing policies on storage.objects for avatars bucket
DROP POLICY IF EXISTS "Service role can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role all operations" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to avatars" ON storage.objects;

-- Step 3: Create very permissive policies (for development/testing)
-- Allow ANYONE to upload to avatars bucket
CREATE POLICY "Allow all uploads to avatars"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

-- Allow ANYONE to read from avatars bucket
CREATE POLICY "Allow all reads from avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow ANYONE to update avatars bucket
CREATE POLICY "Allow all updates to avatars"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow ANYONE to delete from avatars bucket
CREATE POLICY "Allow all deletes from avatars"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'avatars');

-- NOTE: These are very permissive policies for development
-- In production, you should restrict these based on your needs
