#!/usr/bin/env node

/**
 * Seed Brew3D users for development/testing.
 * Creates: studioDev@brew3d.com, indieDev@brew3d.com, reviewDev@brew3d.com, guestDev@brew3d.com
 * Default password for all: brew3d123
 *
 * Usage: node scripts/seed-users.js
 * Requires: .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SEED_USERS = [
  { user_id: 'seed-studio-dev', email: 'studioDev@brew3d.com', name: 'Studio Dev', role: 'member' },
  { user_id: 'seed-indie-dev', email: 'indieDev@brew3d.com', name: 'Indie Dev', role: 'member' },
  { user_id: 'seed-review-dev', email: 'reviewDev@brew3d.com', name: 'Review Dev', role: 'member' },
  { user_id: 'seed-guest-dev', email: 'guestDev@brew3d.com', name: 'Guest Dev', role: 'guest' },
];

const DEFAULT_PASSWORD = 'brew3d123';
const SALT_ROUNDS = 10;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON in .env.local');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const now = new Date().toISOString();

  const supabase = createClient(url, key);

  for (const u of SEED_USERS) {
    const row = {
      user_id: u.user_id,
      email: u.email,
      name: u.name,
      password_hash: passwordHash,
      role: u.role || 'member',
      profile_picture: '',
      security: { twoFactorEnabled: false, totpSecret: null, recoveryCodes: [] },
      preferences: {
        theme: 'light',
        editorSettings: {},
        notifications: { email: true, platform: true, projectUpdates: false },
        language: 'en',
        timezone: 'UTC',
        defaultProjectSettings: {},
      },
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: null,
        features: ['basic-editor', 'basic-assets'],
      },
      created_at: now,
      updated_at: now,
      last_login_at: now,
      is_active: true,
    };

    const { data, error } = await supabase.from('users').upsert(row, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    }).select('user_id, email').single();

    if (error) {
      if (error.code === '23505') {
        console.log(`⏭️  ${u.email} already exists, skipped`);
      } else {
        console.error(`❌ ${u.email}:`, error.message);
      }
      continue;
    }
    console.log(`✅ ${u.email} (${u.name})`);
  }

  console.log('\nDone. All seed users use password: ' + DEFAULT_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
