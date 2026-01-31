-- Create project_docs table if it doesn't exist
-- Run this SQL in Supabase SQL Editor FIRST if the table doesn't exist

CREATE TABLE IF NOT EXISTS project_docs (
    doc_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    links JSONB DEFAULT '{}'::jsonb,
    file_url TEXT DEFAULT '',
    file_type TEXT DEFAULT 'markdown' CHECK (file_type IN ('markdown', 'pdf', 'docx', 'doc', 'txt')),
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_file_type ON project_docs(file_type);
CREATE INDEX IF NOT EXISTS idx_project_docs_created_at ON project_docs(created_at DESC);

-- Add RLS policies (permissive for now)
ALTER TABLE project_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all project_docs operations" ON project_docs;
CREATE POLICY "Allow all project_docs operations" ON project_docs FOR ALL USING (true) WITH CHECK (true);
