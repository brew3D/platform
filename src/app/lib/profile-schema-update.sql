-- Add profile fields to users table
-- Run this SQL in Supabase to add bio, website, location, and social links

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS github TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin TEXT DEFAULT '';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_bio ON users(bio) WHERE bio != '';
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location) WHERE location != '';
