#!/usr/bin/env node
/**
 * Script to apply Supabase migrations using environment variables
 * 
 * This script reads from .env file and applies migrations to Supabase
 * 
 * Requirements:
 * - Either SUPABASE_ACCESS_TOKEN (from `supabase login`)
 * - Or SUPABASE_DB_PASSWORD (database password for direct connection)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
function loadEnv() {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    process.exit(1);
  }
}

const env = loadEnv();
const projectId = env.VITE_SUPABASE_PROJECT_ID || env.SUPABASE_PROJECT_ID;
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const dbPassword = env.SUPABASE_DB_PASSWORD;

console.log('🔍 Checking Supabase connection...');
console.log(`Project ID: ${projectId}`);
console.log(`Supabase URL: ${supabaseUrl}`);

if (!projectId) {
  console.error('❌ SUPABASE_PROJECT_ID not found in .env file');
  process.exit(1);
}

// Try method 1: Use access token
if (accessToken) {
  console.log('🔑 Using access token for authentication...');
  try {
    process.env.SUPABASE_ACCESS_TOKEN = accessToken;
    execSync(`npx supabase link --project-ref ${projectId}`, { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
    });
    console.log('✅ Project linked successfully');
    
    console.log('📤 Pushing migrations...');
    execSync('npx supabase db push', { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
    });
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error with access token method:', error.message);
  }
}

// Try method 2: Use database connection string
if (dbPassword && supabaseUrl) {
  console.log('🔗 Using database connection string...');
  try {
    // Extract project ref from URL
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      throw new Error('Invalid Supabase URL format');
    }
    
    // Try direct connection format first
    const dbUrl = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectId}.supabase.co:5432/postgres`;
    
    console.log('📤 Pushing migrations via database connection...');
    execSync(`npx supabase db push --db-url "${dbUrl}"`, { 
      stdio: 'inherit'
    });
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error with database connection method:', error.message);
  }
}

// If neither method worked
console.error('\n❌ Unable to apply migrations. Please provide one of the following:');
console.error('   1. SUPABASE_ACCESS_TOKEN in .env (get it by running: npx supabase login)');
console.error('   2. SUPABASE_DB_PASSWORD in .env (get it from Supabase dashboard: Settings > Database)');
console.error('\nThen run this script again.');
process.exit(1);

