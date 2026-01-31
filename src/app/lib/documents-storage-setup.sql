-- Supabase Storage Setup for Documents
-- Run this SQL in Supabase SQL Editor

-- Step 1: Make sure the bucket exists and is PUBLIC
-- Go to Dashboard > Storage > New Bucket
-- Name: documents
-- Public: Yes (for reading documents)
-- File size limit: 50MB (or your preference)

-- Step 2: Drop ALL existing policies on storage.objects for documents bucket
DROP POLICY IF EXISTS "Allow all uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete documents" ON storage.objects;

-- Step 3: Create permissive policies (for development/testing)
-- Allow ANYONE to upload to documents bucket
CREATE POLICY "Allow all uploads to documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

-- Allow ANYONE to read from documents bucket
CREATE POLICY "Allow all reads from documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow ANYONE to update documents bucket
CREATE POLICY "Allow all updates to documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Allow ANYONE to delete from documents bucket
CREATE POLICY "Allow all deletes from documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'documents');

-- NOTE: These are very permissive policies for development
-- In production, you should restrict these based on your needs
