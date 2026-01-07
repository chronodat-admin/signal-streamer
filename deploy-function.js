#!/usr/bin/env node
/**
 * Deploy Supabase Edge Function
 * 
 * This script deploys the tradingview-webhook Edge Function to Supabase
 * using the Management API.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
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
    return {};
  }
}

const env = loadEnv();
const projectRef = env.VITE_SUPABASE_PROJECT_ID || 'ogcnilkuneeqkhmoamxi';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is required!');
  console.error('\nTo get an access token:');
  console.error('1. Run: npx supabase login');
  console.error('2. Or get it from: https://supabase.com/dashboard/account/tokens');
  console.error('3. Then set: SUPABASE_ACCESS_TOKEN=your_token_here');
  console.error('\nAlternatively, deploy via Supabase Dashboard:');
  console.error('https://supabase.com/dashboard/project/' + projectRef + '/functions');
  process.exit(1);
}

// Read function code
const functionCode = readFileSync(
  join(__dirname, 'supabase', 'functions', 'tradingview-webhook', 'index.ts'),
  'utf-8'
);

console.log('🚀 Deploying Edge Function: tradingview-webhook');
console.log(`📦 Project: ${projectRef}`);
console.log(`📝 Code size: ${functionCode.length} bytes\n`);

// Deploy using Supabase Management API
const deployFunction = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'tradingview-webhook',
      body: functionCode,
      verify_jwt: false, // Allow public access
    });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/functions/tradingview-webhook`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Function deployed successfully!');
          console.log(`\n🌐 Function URL:`);
          console.log(`https://${projectRef}.supabase.co/functions/v1/tradingview-webhook`);
          resolve(data);
        } else {
          console.error(`❌ Deployment failed with status ${res.statusCode}`);
          console.error('Response:', data);
          try {
            const error = JSON.parse(data);
            if (error.message) {
              console.error('Error:', error.message);
            }
          } catch (e) {
            console.error('Raw response:', data);
          }
          reject(new Error(`Deployment failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

deployFunction()
  .then(() => {
    console.log('\n✨ Deployment complete! The function is now live.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Alternative: Deploy via Supabase Dashboard');
    console.error(`   https://supabase.com/dashboard/project/${projectRef}/functions`);
    process.exit(1);
  });

