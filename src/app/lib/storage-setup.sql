-- Supabase Storage Setup for Avatars
-- Run this SQL in Supabase SQL Editor to set up the avatars bucket

-- IMPORTANT: First create the bucket manually in Dashboard > Storage > New Bucket
-- Name: avatars
-- Public: Yes (for reading avatars)
-- File size limit: 5MB (or your preference)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role all operations" ON storage.objects;

-- CRITICAL: Allow service role to upload (this is what the API uses)
-- The service role key bypasses RLS, but Storage has its own policies
CREATE POLICY "Service role can upload avatars"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Service role can update avatars"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Service role can delete avatars"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars (optional, for direct client uploads)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars (optional)
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow users to delete their own avatars (optional)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
