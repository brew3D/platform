-- Add file upload support to project_docs table
-- Run this SQL in Supabase SQL Editor

-- Add columns for file uploads
ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT '';
ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'markdown' CHECK (file_type IN ('markdown', 'pdf', 'docx', 'doc'));
ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT '';

-- Create index for file_type queries
CREATE INDEX IF NOT EXISTS idx_project_docs_file_type ON project_docs(file_type);

-- Update existing docs to have file_type = 'markdown'
UPDATE project_docs SET file_type = 'markdown' WHERE file_type IS NULL OR file_type = '';
