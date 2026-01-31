-- Supabase Storage Setup for Avatars
-- Run this SQL in Supabase SQL Editor to set up the avatars bucket

-- Create the avatars bucket if it doesn't exist
-- Note: Buckets are created via the Supabase Dashboard Storage section, not SQL
-- But we can set up RLS policies here

-- First, ensure the bucket exists (create it manually in Dashboard > Storage)
-- Then run these policies:

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Alternative: If using service role (admin), you can bypass RLS entirely
-- But for now, let's use a simpler approach - make the bucket public for reads
-- and allow authenticated uploads

-- For service role uploads (what we're doing in the API), we need to either:
-- 1. Use service role key (which bypasses RLS) - CURRENT APPROACH
-- 2. Or configure bucket to allow public uploads (not recommended)

-- Since we're using getSupabaseAdmin(), the service role should bypass RLS
-- The issue might be that the bucket doesn't exist or isn't configured properly
