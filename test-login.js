/**
 * Quick Login Test Script
 * 
 * Test RLS policies untuk tabel public.users
 * 
 * Usage:
 *   node test-login.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env file
let SUPABASE_URL, SUPABASE_ANON_KEY;

try {
  const envFile = readFileSync('.env', 'utf-8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test accounts
const TEST_ACCOUNTS = [
  {
    email: 'cindy@example.com',
    password: 'password123',
    expectedRole: 'super_admin',
    name: 'Cindy (Super Admin)'
  },
  {
    email: 'dian@example.com',
    password: 'password123',
    expectedRole: 'owner',
    name: 'Dian (Owner)'
  },
  {
    email: 'sundari@example.com',
    password: 'password123',
    expectedRole: 'kasir',
    name: 'Sundari (Kasir)'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function testLogin(account) {
  logSection(`Testing: ${account.name}`);
  
  try {
    // Step 1: Sign out
    log('1️⃣  Signing out previous session...', 'cyan');
    await supabase.auth.signOut();
    
    // Step 2: Sign in
    log(`2️⃣  Signing in as ${account.email}...`, 'cyan');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password
    });
    
    if (authError) {
      log(`❌ Auth Error: ${authError.message}`, 'red');
      return { success: false, error: authError.message };
    }
    
    log('✅ Authentication successful!', 'green');
    log(`   User ID: ${authData.user.id}`, 'blue');
    
    // Step 3: Query public.users (CRITICAL TEST)
    log('3️⃣  Querying public.users table (RLS Policy Test)...', 'cyan');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, full_name, tenant_id, role')
      .eq('user_id', authData.user.id)
      .single();
    
    if (userError) {
      log(`❌ RLS Policy Error: ${userError.message}`, 'red');
      log('⚠️  User cannot query own data! RLS policy may not be working.', 'yellow');
      return { success: false, error: userError.message };
    }
    
    log('✅ RLS Policy working! User can query own data.', 'green');
    log(`   Role: ${userData.role}`, 'blue');
    log(`   Tenant ID: ${userData.tenant_id || 'N/A'}`, 'blue');
    
    // Step 4: Verify role
    if (userData.role === account.expectedRole) {
      log(`✅ Role verification passed: ${userData.role}`, 'green');
    } else {
      log(`⚠️  Role mismatch: Expected ${account.expectedRole}, got ${userData.role}`, 'yellow');
    }
    
    // Step 5: Check tenant status (if not super_admin)
    if (userData.role !== 'super_admin' && userData.tenant_id) {
      log('4️⃣  Checking tenant status...', 'cyan');
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, status')
        .eq('id', userData.tenant_id)
        .single();
      
      if (tenantError) {
        log(`❌ Tenant query error: ${tenantError.message}`, 'red');
      } else {
        log(`✅ Tenant: ${tenantData.name} (${tenantData.status})`, 'green');
      }
    }
    
    // Step 6: Test viewing other users
    log('5️⃣  Testing user list access (based on role)...', 'cyan');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('user_id, email, role, tenant_id')
      .limit(20);
    
    if (allUsersError) {
      log(`❌ Cannot query users list: ${allUsersError.message}`, 'red');
    } else {
      log(`✅ Can view ${allUsers.length} users`, 'green');
      
      // Analyze visible users
      const sameTenantCount = allUsers.filter(u => u.tenant_id === userData.tenant_id).length;
      const differentTenantCount = allUsers.filter(u => u.tenant_id !== userData.tenant_id && u.tenant_id !== null).length;
      
      log(`   - Same tenant: ${sameTenantCount}`, 'blue');
      log(`   - Different tenant: ${differentTenantCount}`, 'blue');
      
      // Verify based on role
      if (userData.role === 'super_admin') {
        if (differentTenantCount > 0) {
          log('✅ Super admin can see users from different tenants', 'green');
        } else {
          log('⚠️  Super admin should see users from different tenants', 'yellow');
        }
      } else if (userData.role === 'owner') {
        if (differentTenantCount === 0 && sameTenantCount > 1) {
          log('✅ Owner can only see users in same tenant', 'green');
        } else if (differentTenantCount > 0) {
          log('❌ Owner should NOT see users from different tenants!', 'red');
        }
      } else if (userData.role === 'kasir') {
        if (allUsers.length === 1) {
          log('✅ Kasir can only see own data', 'green');
        } else {
          log('❌ Kasir should only see own data!', 'red');
        }
      }
    }
    
    log('🎉 Test completed!', 'green');
    return { success: true };
    
  } catch (error) {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  logSection('🧪 Starting RLS Policy Tests');
  log(`Project: ${SUPABASE_URL}`, 'cyan');
  log(`Testing ${TEST_ACCOUNTS.length} accounts\n`, 'cyan');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    const result = await testLogin(account);
    results.push({
      name: account.name,
      ...result
    });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  logSection('📊 Test Summary');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }
  });
  
  console.log('\n' + '='.repeat(60));
  log(`Total: ${results.length} | Success: ${successCount} | Failed: ${failCount}`, 'bright');
  console.log('='.repeat(60) + '\n');
  
  if (failCount === 0) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the logs above.', 'yellow');
  }
  
  // Sign out at the end
  await supabase.auth.signOut();
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
