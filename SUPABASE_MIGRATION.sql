-- ===========================================
-- Brew3D Supabase Database Migration
-- ===========================================
-- This file contains all SQL instructions to replicate
-- the DynamoDB structure on Supabase PostgreSQL
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB operations
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member', 'guest')),
    profile_picture TEXT DEFAULT '',
    security JSONB DEFAULT '{"twoFactorEnabled": false, "totpSecret": null, "recoveryCodes": []}'::jsonb,
    preferences JSONB DEFAULT '{"theme": "light", "editorSettings": {}, "notifications": {"email": true, "platform": true, "projectUpdates": false}, "language": "en", "timezone": "UTC", "defaultProjectSettings": {}}'::jsonb,
    subscription JSONB DEFAULT '{"plan": "free", "status": "active", "expiresAt": null, "features": ["basic-editor", "basic-assets"]}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ===========================================
-- PROJECTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    team_members TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{"template": "blank", "gameType": "platformer", "platform": "web", "collaboration": {"allowComments": true, "allowEdits": false, "allowViewing": true}, "aiSettings": {"autoSave": true, "suggestions": true, "codeCompletion": true}}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    engine_type TEXT DEFAULT 'unreal' CHECK (engine_type IN ('unreal', 'unity')),
    engine_version TEXT DEFAULT '',
    repo_url TEXT DEFAULT '',
    default_branch TEXT DEFAULT 'main',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_team_members ON projects USING GIN(team_members);

-- Add new columns to existing projects table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='engine_type') THEN
        ALTER TABLE projects ADD COLUMN engine_type TEXT DEFAULT 'unreal' CHECK (engine_type IN ('unreal', 'unity'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='engine_version') THEN
        ALTER TABLE projects ADD COLUMN engine_version TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='repo_url') THEN
        ALTER TABLE projects ADD COLUMN repo_url TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='default_branch') THEN
        ALTER TABLE projects ADD COLUMN default_branch TEXT DEFAULT 'main';
    END IF;
END $$;

-- ===========================================
-- SCENES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS scenes (
    scene_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    scene_data JSONB DEFAULT '{"objects": [], "lighting": {}, "camera": {}, "physics": {}, "scripts": [], "metadata": {}}'::jsonb,
    thumbnail TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON scenes(project_id, "order");
CREATE INDEX IF NOT EXISTS idx_scenes_is_published ON scenes(is_published);

-- ===========================================
-- MAPS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS maps (
    map_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    map_data JSONB DEFAULT '{"tiles": [], "layers": [], "objects": [], "spawnPoints": [], "metadata": {}}'::jsonb,
    thumbnail TEXT DEFAULT '',
    size JSONB DEFAULT '{"width": 32, "height": 32}'::jsonb,
    tileset TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maps_project_id ON maps(project_id);
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at DESC);

-- ===========================================
-- FLOW TABLES (PROJECT_FLOWS, FLOW_NODES, FLOW_EDGES, FLOW_STARTPOINTS)
-- ===========================================
CREATE TABLE IF NOT EXISTS project_flows (
    flow_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main Flow',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_flows_project_id ON project_flows(project_id);

CREATE TABLE IF NOT EXISTS flow_nodes (
    node_id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL REFERENCES project_flows(flow_id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    node_type TEXT NOT NULL DEFAULT 'level' CHECK (node_type IN ('level', 'menu', 'loading', 'cutscene', 'hub', 'other')),
    engine_level_name TEXT,
    unity_scene_name TEXT,
    map_id TEXT REFERENCES maps(map_id) ON DELETE SET NULL,
    layout JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_project_id ON flow_nodes(project_id);

CREATE TABLE IF NOT EXISTS flow_edges (
    edge_id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL REFERENCES project_flows(flow_id) ON DELETE CASCADE,
    from_node_id TEXT NOT NULL REFERENCES flow_nodes(node_id) ON DELETE CASCADE,
    to_node_id TEXT NOT NULL REFERENCES flow_nodes(node_id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_edges_flow_id ON flow_edges(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_edges_from_to ON flow_edges(from_node_id, to_node_id);

CREATE TABLE IF NOT EXISTS flow_startpoints (
    flow_id TEXT PRIMARY KEY REFERENCES project_flows(flow_id) ON DELETE CASCADE,
    start_node_id TEXT REFERENCES flow_nodes(node_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ENGINE PREVIEWS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS engine_previews (
    preview_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    engine_type TEXT NOT NULL,
    commit_sha TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')) DEFAULT 'queued',
    stream_url TEXT DEFAULT '',
    logs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_previews_project_id ON engine_previews(project_id);
CREATE INDEX IF NOT EXISTS idx_engine_previews_status ON engine_previews(status);
CREATE INDEX IF NOT EXISTS idx_engine_previews_created_at ON engine_previews(created_at DESC);

-- ===========================================
-- BUILDS TABLE (CI/CD)
-- ===========================================
CREATE TABLE IF NOT EXISTS builds (
    build_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    engine_type TEXT NOT NULL,
    commit_sha TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')) DEFAULT 'queued',
    logs TEXT DEFAULT '',
    artifacts JSONB DEFAULT '{}'::jsonb,
    trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'git', 'ai')) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builds_project_id ON builds(project_id);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_builds_created_at ON builds(created_at DESC);

-- ===========================================
-- PROJECT DOCS TABLE (Knowledge Base)
-- ===========================================
CREATE TABLE IF NOT EXISTS project_docs (
    doc_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_created_at ON project_docs(created_at DESC);

-- ===========================================
-- PROJECT SNAPSHOTS TABLE (Versioning)
-- ===========================================
CREATE TABLE IF NOT EXISTS project_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    commit_sha TEXT DEFAULT '',
    snapshot_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_at ON project_snapshots(created_at DESC);

-- ===========================================
-- CHARACTERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS characters (
    character_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    character_data JSONB DEFAULT '{"model": "", "animations": [], "abilities": [], "inventory": [], "ai": {}, "metadata": {}}'::jsonb,
    thumbnail TEXT DEFAULT '',
    type TEXT DEFAULT 'npc' CHECK (type IN ('player', 'npc', 'enemy', 'item')),
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_characters_type ON characters(type);

-- ===========================================
-- SCRIPTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS scripts (
    script_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    map_id TEXT REFERENCES maps(map_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    elements JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_project_id ON scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_scripts_map_id ON scripts(map_id);

-- ===========================================
-- ASSETS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS assets (
    asset_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('3d-model', 'texture', 'sound', 'script')),
    creator_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    thumbnail TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    price INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    reviews JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_creator_id ON assets(creator_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- ===========================================
-- PROJECT ASSETS TABLE (Project-scoped asset registry)
-- ===========================================
CREATE TABLE IF NOT EXISTS project_assets (
    project_asset_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('3d-model', 'texture', 'sound', 'script', 'other')),
    source TEXT NOT NULL CHECK (source IN ('upload', 'external', 'engine')) DEFAULT 'engine',
    engine_path TEXT DEFAULT '',
    license TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_type ON project_assets(type);
CREATE INDEX IF NOT EXISTS idx_project_assets_source ON project_assets(source);
CREATE INDEX IF NOT EXISTS idx_project_assets_tags ON project_assets USING GIN(tags);

-- ===========================================
-- FLOW NODE ASSETS TABLE (Links assets to Flow nodes)
-- ===========================================
CREATE TABLE IF NOT EXISTS flow_node_assets (
    node_id TEXT NOT NULL REFERENCES flow_nodes(node_id) ON DELETE CASCADE,
    project_asset_id TEXT NOT NULL REFERENCES project_assets(project_asset_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (node_id, project_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_flow_node_assets_node_id ON flow_node_assets(node_id);
CREATE INDEX IF NOT EXISTS idx_flow_node_assets_asset_id ON flow_node_assets(project_asset_id);

-- ===========================================
-- TUTORIALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS tutorials (
    tutorial_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration INTEGER DEFAULT 0,
    video_url TEXT NOT NULL,
    thumbnail TEXT DEFAULT '',
    creator_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category);
CREATE INDEX IF NOT EXISTS idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX IF NOT EXISTS idx_tutorials_creator_id ON tutorials(creator_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_published ON tutorials(is_published);
CREATE INDEX IF NOT EXISTS idx_tutorials_tags ON tutorials USING GIN(tags);

-- ===========================================
-- COMMUNITY POSTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS community_posts (
    post_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'tutorial')),
    attachments TEXT[] DEFAULT '{}',
    likes TEXT[] DEFAULT '{}',
    comments JSONB DEFAULT '[]'::jsonb,
    shares INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON community_posts(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes ON community_posts USING GIN(likes);

-- ===========================================
-- EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    organizer_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_date TIMESTAMPTZ NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location JSONB DEFAULT '{}'::jsonb,
    category TEXT DEFAULT 'other' CHECK (category IN ('workshop', 'meetup', 'conference', 'social', 'other')),
    type TEXT DEFAULT 'online' CHECK (type IN ('online', 'in-person', 'hybrid')),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    price INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    tags TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    resources TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    is_public BOOLEAN DEFAULT TRUE,
    allow_waitlist BOOLEAN DEFAULT FALSE,
    registration_deadline TIMESTAMPTZ,
    reminder_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public, event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- ===========================================
-- EVENT RSVPS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'not-attending', 'maybe', 'waitlist')),
    rsvp_date TIMESTAMPTZ DEFAULT NOW(),
    plus_ones INTEGER DEFAULT 0,
    dietary_restrictions TEXT,
    notes TEXT,
    check_in_time TIMESTAMPTZ,
    feedback JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

-- ===========================================
-- BADGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS badges (
    badge_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('community', 'content', 'achievement', 'special')),
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '#667eea',
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    points INTEGER DEFAULT 0,
    requirements JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_secret BOOLEAN DEFAULT FALSE,
    max_earners INTEGER,
    current_earners INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active);

-- ===========================================
-- USER BADGES TABLE (Junction)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_badges (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_displayed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ===========================================
-- USER POINTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_points (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    experience_to_next INTEGER DEFAULT 100,
    points_by_category JSONB DEFAULT '{"community": 0, "content": 0, "events": 0, "social": 0, "special": 0}'::jsonb,
    last_earned_at TIMESTAMPTZ DEFAULT NOW(),
    streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level DESC);

-- ===========================================
-- LEADERBOARDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS leaderboards (
    leaderboard_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('points', 'badges', 'posts', 'events', 'custom')),
    category TEXT,
    time_range TEXT DEFAULT 'all-time' CHECK (time_range IN ('all-time', 'monthly', 'weekly', 'daily')),
    criteria JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    max_entries INTEGER DEFAULT 100,
    refresh_interval INTEGER DEFAULT 60,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    entries JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_is_active ON leaderboards(is_active);
CREATE INDEX IF NOT EXISTS idx_leaderboards_is_public ON leaderboards(is_public);

-- ===========================================
-- CHATS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS chats (
    chat_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT,
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'channel')),
    participants TEXT[] DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);

-- ===========================================
-- MESSAGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS messages (
    message_id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
    attachments TEXT[] DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    read_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- ===========================================
-- TEAMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS teams (
    team_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    members TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_members ON teams USING GIN(members);

-- ===========================================
-- PRESENCE TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS presence (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL,
    cursor_position JSONB DEFAULT '{}'::jsonb,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, scene_id)
);

CREATE INDEX IF NOT EXISTS idx_presence_scene_id ON presence(scene_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen DESC);

-- ===========================================
-- LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS logs (
    scene_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (scene_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_logs_scene_id ON logs(scene_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);

-- ===========================================
-- HIGHLIGHTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS highlights (
    scene_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    selection JSONB NOT NULL,
    color TEXT DEFAULT '#ffff00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (scene_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_highlights_scene_id ON highlights(scene_id);

-- ===========================================
-- WEBHOOKS TABLE (if exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS webhooks (
    webhook_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables (idempotent)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_scenes_updated_at ON scenes;
DROP TRIGGER IF EXISTS update_maps_updated_at ON maps;
DROP TRIGGER IF EXISTS update_project_flows_updated_at ON project_flows;
DROP TRIGGER IF EXISTS update_flow_nodes_updated_at ON flow_nodes;
DROP TRIGGER IF EXISTS update_flow_edges_updated_at ON flow_edges;
DROP TRIGGER IF EXISTS update_flow_startpoints_updated_at ON flow_startpoints;
DROP TRIGGER IF EXISTS update_engine_previews_updated_at ON engine_previews;
DROP TRIGGER IF EXISTS update_builds_updated_at ON builds;
DROP TRIGGER IF EXISTS update_project_docs_updated_at ON project_docs;
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
DROP TRIGGER IF EXISTS update_project_assets_updated_at ON project_assets;
DROP TRIGGER IF EXISTS update_tutorials_updated_at ON tutorials;
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON event_rsvps;
DROP TRIGGER IF EXISTS update_badges_updated_at ON badges;
DROP TRIGGER IF EXISTS update_user_badges_updated_at ON user_badges;
DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
DROP TRIGGER IF EXISTS update_leaderboards_updated_at ON leaderboards;
DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_highlights_updated_at ON highlights;
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maps_updated_at BEFORE UPDATE ON maps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_flows_updated_at BEFORE UPDATE ON project_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flow_nodes_updated_at BEFORE UPDATE ON flow_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flow_edges_updated_at BEFORE UPDATE ON flow_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flow_startpoints_updated_at BEFORE UPDATE ON flow_startpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engine_previews_updated_at BEFORE UPDATE ON engine_previews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON builds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_docs_updated_at BEFORE UPDATE ON project_docs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_assets_updated_at BEFORE UPDATE ON project_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON event_rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_badges_updated_at BEFORE UPDATE ON user_badges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_message_at in chats
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats SET last_message_at = NEW.timestamp WHERE chat_id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_chat_last_message_trigger ON messages;
CREATE TRIGGER update_chat_last_message_trigger AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Function to update current_attendees in events
CREATE OR REPLACE FUNCTION update_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'attending' THEN
        UPDATE events SET current_attendees = current_attendees + 1 WHERE event_id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'attending' AND NEW.status = 'attending' THEN
            UPDATE events SET current_attendees = current_attendees + 1 WHERE event_id = NEW.event_id;
        ELSIF OLD.status = 'attending' AND NEW.status != 'attending' THEN
            UPDATE events SET current_attendees = GREATEST(0, current_attendees - 1) WHERE event_id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'attending' THEN
        UPDATE events SET current_attendees = GREATEST(0, current_attendees - 1) WHERE event_id = OLD.event_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_attendees_trigger ON event_rsvps;
CREATE TRIGGER update_event_attendees_trigger AFTER INSERT OR UPDATE OR DELETE ON event_rsvps FOR EACH ROW EXECUTE FUNCTION update_event_attendees();

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_startpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_node_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Basic policies (you may want to customize these)
-- Note: Since we're using JWT auth (not Supabase Auth), these policies allow operations
-- In production, you should use Supabase Auth and proper RLS policies

-- Users policies (idempotent)
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- Projects policies (idempotent)
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (true);

-- Public read for published content (idempotent)
DROP POLICY IF EXISTS "Public can read published assets" ON assets;
CREATE POLICY "Public can read published assets" ON assets FOR SELECT USING (status = 'approved' AND published_at IS NOT NULL);
DROP POLICY IF EXISTS "Public can read published tutorials" ON tutorials;
CREATE POLICY "Public can read published tutorials" ON tutorials FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "Public can read public events" ON events;
CREATE POLICY "Public can read public events" ON events FOR SELECT USING (is_public = TRUE AND status = 'published');

-- ===========================================
-- COMPLETION MESSAGE
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase migration completed successfully!';
    RAISE NOTICE '📊 All tables, indexes, triggers, and policies have been created.';
    RAISE NOTICE '🔐 Remember to configure Row Level Security policies according to your needs.';
END $$;

