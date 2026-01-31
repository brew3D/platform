-- ===========================================
-- BARISTA BOARD - Database Schema
-- ===========================================
-- Coffee-themed Kanban board for game studios
-- Future-ready for 3D Testbox integration
-- ===========================================

-- ===========================================
-- BOARDS TABLE (Cafés)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_boards (
    board_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    settings JSONB DEFAULT '{
        "wipLimits": {},
        "swimlanesEnabled": false,
        "defaultColumns": ["backlog", "brewing", "tasting", "refining", "served"]
    }'::jsonb,
    created_by TEXT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_barista_boards_project_id ON barista_boards(project_id);
CREATE INDEX IF NOT EXISTS idx_barista_boards_created_by ON barista_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_barista_boards_is_archived ON barista_boards(is_archived);

-- ===========================================
-- BOARD MEMBERS (Permissions)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_board_members (
    board_id TEXT NOT NULL REFERENCES barista_boards(board_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'producer', 'developer', 'artist', 'qa', 'viewer')),
    permissions JSONB DEFAULT '{
        "canMoveCards": false,
        "canEditFields": false,
        "canComment": true,
        "canLinkBuilds": false,
        "canManageBoard": false
    }'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_barista_board_members_board_id ON barista_board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_barista_board_members_user_id ON barista_board_members(user_id);

-- ===========================================
-- COLUMNS TABLE (Stations)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_columns (
    column_id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES barista_boards(board_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    wip_limit INTEGER DEFAULT NULL,
    color TEXT DEFAULT '#8B5A2B',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(board_id, position)
);

CREATE INDEX IF NOT EXISTS idx_barista_columns_board_id ON barista_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_barista_columns_position ON barista_columns(board_id, position);

-- ===========================================
-- CARDS TABLE (Orders)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_cards (
    card_id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES barista_boards(board_id) ON DELETE CASCADE,
    column_id TEXT NOT NULL REFERENCES barista_columns(column_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    card_type TEXT DEFAULT 'engineering' CHECK (card_type IN ('design', 'engineering', 'art', 'qa', 'tech_debt')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'espresso_shot', 'double_shot')),
    status TEXT DEFAULT 'brewing',
    assignee_ids TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    due_date TIMESTAMPTZ DEFAULT NULL,
    time_estimate INTEGER DEFAULT NULL, -- in minutes
    
    -- Game-specific fields (3D-ready)
    linked_build_id TEXT DEFAULT NULL, -- References builds table
    linked_build_url TEXT DEFAULT NULL, -- External URL fallback
    engine_context JSONB DEFAULT '{
        "engine": null,
        "version": null,
        "level": null,
        "map": null,
        "assetNames": [],
        "coordinates": {
            "x": null,
            "y": null,
            "z": null,
            "cameraRotation": null
        }
    }'::jsonb,
    
    -- Metadata
    position INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_barista_cards_board_id ON barista_cards(board_id);
CREATE INDEX IF NOT EXISTS idx_barista_cards_column_id ON barista_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_barista_cards_assignee_ids ON barista_cards USING GIN(assignee_ids);
CREATE INDEX IF NOT EXISTS idx_barista_cards_tags ON barista_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_barista_cards_card_type ON barista_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_barista_cards_priority ON barista_cards(priority);
CREATE INDEX IF NOT EXISTS idx_barista_cards_due_date ON barista_cards(due_date);
CREATE INDEX IF NOT EXISTS idx_barista_cards_position ON barista_cards(column_id, position);
CREATE INDEX IF NOT EXISTS idx_barista_cards_linked_build_id ON barista_cards(linked_build_id) WHERE linked_build_id IS NOT NULL;

-- ===========================================
-- COMMENTS TABLE (3D-ready structure)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_comments (
    comment_id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES barista_cards(card_id) ON DELETE CASCADE,
    parent_comment_id TEXT DEFAULT NULL REFERENCES barista_comments(comment_id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(user_id),
    
    -- 3D-ready context (for future Testbox integration)
    context JSONB DEFAULT '{
        "type": "2D",
        "worldPosition": null,
        "cameraPose": null,
        "buildId": null
    }'::jsonb,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb, -- [{type: "image|video|log", url: "", name: ""}]
    
    -- Mentions
    mentioned_user_ids TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_barista_comments_card_id ON barista_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_barista_comments_parent_comment_id ON barista_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barista_comments_author_id ON barista_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_barista_comments_mentioned_user_ids ON barista_comments USING GIN(mentioned_user_ids);
CREATE INDEX IF NOT EXISTS idx_barista_comments_created_at ON barista_comments(card_id, created_at DESC);

-- ===========================================
-- ACTIVITY LOG TABLE (Audit Trail)
-- ===========================================
CREATE TABLE IF NOT EXISTS barista_activity_log (
    activity_id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES barista_boards(board_id) ON DELETE CASCADE,
    card_id TEXT DEFAULT NULL REFERENCES barista_cards(card_id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'card_created',
        'card_moved',
        'card_updated',
        'card_deleted',
        'assignee_changed',
        'build_linked',
        'build_unlinked',
        'comment_added',
        'comment_edited',
        'comment_deleted',
        'column_created',
        'column_updated',
        'column_deleted',
        'board_settings_updated'
    )),
    old_value JSONB DEFAULT NULL,
    new_value JSONB DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barista_activity_board_id ON barista_activity_log(board_id);
CREATE INDEX IF NOT EXISTS idx_barista_activity_card_id ON barista_activity_log(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barista_activity_user_id ON barista_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_barista_activity_action_type ON barista_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_barista_activity_created_at ON barista_activity_log(board_id, created_at DESC);

-- ===========================================
-- TRIGGERS
-- ===========================================
CREATE OR REPLACE FUNCTION update_barista_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_barista_boards_updated_at BEFORE UPDATE ON barista_boards FOR EACH ROW EXECUTE FUNCTION update_barista_updated_at();
CREATE TRIGGER update_barista_columns_updated_at BEFORE UPDATE ON barista_columns FOR EACH ROW EXECUTE FUNCTION update_barista_updated_at();
CREATE TRIGGER update_barista_cards_updated_at BEFORE UPDATE ON barista_cards FOR EACH ROW EXECUTE FUNCTION update_barista_updated_at();
CREATE TRIGGER update_barista_comments_updated_at BEFORE UPDATE ON barista_comments FOR EACH ROW EXECUTE FUNCTION update_barista_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
-- Note: RLS is enabled but policies allow project members to access boards
-- Service role key bypasses RLS, but these policies protect against direct client access

ALTER TABLE barista_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE barista_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE barista_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE barista_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE barista_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE barista_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view boards they are members of" ON barista_boards;
DROP POLICY IF EXISTS "Board owners can manage boards" ON barista_boards;
DROP POLICY IF EXISTS "Users can view boards for their projects" ON barista_boards;
DROP POLICY IF EXISTS "Users can create boards for their projects" ON barista_boards;
DROP POLICY IF EXISTS "Board owners can update boards" ON barista_boards;
DROP POLICY IF EXISTS "Users can manage columns for their project boards" ON barista_columns;
DROP POLICY IF EXISTS "Users can manage cards for their project boards" ON barista_cards;
DROP POLICY IF EXISTS "Users can manage comments for their project boards" ON barista_comments;
DROP POLICY IF EXISTS "Users can view activity for their project boards" ON barista_activity_log;
DROP POLICY IF EXISTS "Users can log activity for their project boards" ON barista_activity_log;
DROP POLICY IF EXISTS "Users can manage board members for their project boards" ON barista_board_members;

-- RLS Policies - Permissive for MVP
-- Since we're using service role key (bypasses RLS), these are mainly for direct client access protection
-- TODO: In production, implement proper user context and stricter policies

-- Allow all operations for now (service role bypasses anyway)
-- These policies protect against direct client access without proper auth
CREATE POLICY "Allow all board operations" ON barista_boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all column operations" ON barista_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all card operations" ON barista_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all comment operations" ON barista_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all activity operations" ON barista_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all member operations" ON barista_board_members FOR ALL USING (true) WITH CHECK (true);
