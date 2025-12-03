#!/usr/bin/env node

/**
 * Script to add admin users to the database
 * Run with: node scripts/setup-admin.js <email>
 * or: npm run admin:add <email>
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required environment variables:');
  console.error('  - PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdmin(email) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw userError;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('💡 User must register first before being granted admin access');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (${user.id})`);

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingAdmin) {
      console.log(`⚠️  User is already an admin (role: ${existingAdmin.role})`);
      process.exit(0);
    }

    // Add to admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        user_id: user.id,
        role: 'admin',
        granted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('');
    console.log('✅ Admin access granted successfully!');
    console.log('');
    console.log('Details:');
    console.log(`  Email: ${email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Role: ${data.role}`);
    console.log(`  Granted At: ${data.granted_at}`);
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Main
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/setup-admin.js <email>');
  console.log('Example: node scripts/setup-admin.js admin@mapofus.com');
  process.exit(1);
}

addAdmin(email);
