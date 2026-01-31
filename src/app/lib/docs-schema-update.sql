-- Add file upload support to project_docs table
-- Run this SQL in Supabase SQL Editor
-- NOTE: If project_docs table doesn't exist, run project-docs-table-create.sql FIRST

-- Check if table exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_docs') THEN
        RAISE NOTICE 'Table project_docs does not exist. Please run project-docs-table-create.sql first.';
    END IF;
END $$;

-- Add columns for file uploads (will fail gracefully if columns already exist)
DO $$
BEGIN
    ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT '';
    ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'markdown';
    ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
    ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT '';
    
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_docs_file_type_check'
    ) THEN
        ALTER TABLE project_docs ADD CONSTRAINT project_docs_file_type_check 
        CHECK (file_type IN ('markdown', 'pdf', 'docx', 'doc'));
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table project_docs does not exist. Please run project-docs-table-create.sql first.';
END $$;

-- Create index for file_type queries
CREATE INDEX IF NOT EXISTS idx_project_docs_file_type ON project_docs(file_type);

-- Update existing docs to have file_type = 'markdown'
UPDATE project_docs SET file_type = 'markdown' WHERE file_type IS NULL OR file_type = '';
