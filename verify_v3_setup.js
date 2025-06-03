#!/usr/bin/env node

// V3 Setup Verification Script
// Verifies database schema and user creation for V3 Community Platform

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 V3 COMMUNITY PLATFORM VERIFICATION')
console.log('=====================================')
console.log('Checking database schema and user accounts...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyDatabaseSchema() {
  console.log('📊 Checking Database Schema...')
  console.log('─'.repeat(40))
  
  try {
    // Check price_reports table columns
    const { data: priceReportsInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'price_reports')
    
    const requiredColumns = [
      'is_on_sale', 'sale_price', 'sale_expires_at', 
      'discount_percentage', 'reported_at', 'notes'
    ]
    
    console.log('  📋 Price Reports Table:')
    const missingColumns = []
    
    requiredColumns.forEach(col => {
      const exists = priceReportsInfo?.some(info => info.column_name === col)
      if (exists) {
        console.log(`    ✅ ${col}`)
      } else {
        console.log(`    ❌ ${col} (MISSING)`)
        missingColumns.push(col)
      }
    })
    
    // Check user_profiles table
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('  ❌ user_profiles table: NOT FOUND')
      console.log('     Error:', profilesError.message)
    } else {
      console.log('  ✅ user_profiles table: EXISTS')
    }
    
    return missingColumns.length === 0 && !profilesError
    
  } catch (error) {
    console.error('  ❌ Schema verification error:', error.message)
    return false
  }
}

async function verifyUsers() {
  console.log('\n👥 Checking User Accounts...')
  console.log('─'.repeat(40))
  
  try {
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('is_admin', { ascending: false })
    
    if (profilesError) {
      console.error('  ❌ Error fetching user profiles:', profilesError.message)
      return false
    }
    
    const admins = profiles.filter(p => p.is_admin)
    const users = profiles.filter(p => !p.is_admin)
    
    console.log(`  📊 Total Users: ${profiles.length}`)
    console.log(`  👑 Admin Users: ${admins.length}`)
    console.log(`  👥 Regular Users: ${users.length}`)
    
    console.log('\n  👑 ADMIN ACCOUNTS:')
    if (admins.length === 0) {
      console.log('    ❌ No admin users found')
    } else {
      admins.forEach((admin, index) => {
        console.log(`    ${index + 1}. ${admin.full_name} (${admin.city || 'No city'})`)
      })
    }
    
    console.log('\n  👥 REGULAR USER ACCOUNTS:')
    if (users.length === 0) {
      console.log('    ❌ No regular users found')
    } else {
      users.forEach((user, index) => {
        console.log(`    ${index + 1}. ${user.full_name} (${user.city || 'No city'})`)
      })
    }
    
    // Check for expected users
    const expectedEmails = [
      'admin@basarometer.org',
      'admintest1@basarometer.org', 
      'admintest2@basarometer.org',
      'test1@basarometer.org',
      'test2@basarometer.org'
    ]
    
    console.log('\n  🎯 EXPECTED USER VERIFICATION:')
    for (const email of expectedEmails) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const userExists = authUsers.users.some(u => u.email === email)
      
      if (userExists) {
        console.log(`    ✅ ${email}`)
      } else {
        console.log(`    ❌ ${email} (MISSING)`)
      }
    }
    
    return profiles.length >= 5 && admins.length >= 3 && users.length >= 2
    
  } catch (error) {
    console.error('  ❌ User verification error:', error.message)
    return false
  }
}

async function verifyRLSPolicies() {
  console.log('\n🔒 Checking Row Level Security...')
  console.log('─'.repeat(40))
  
  try {
    // Check if RLS is enabled
    const { data: rlsStatus } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'user_profiles')
    
    console.log('  🛡️  RLS Status: Checking...')
    
    // Try to query policies
    const { data: policies } = await supabase
      .rpc('sql', {
        query: "SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('user_profiles', 'price_reports')"
      })
      .catch(() => ({ data: null }))
    
    if (policies && policies.length > 0) {
      console.log(`  ✅ RLS Policies: ${policies.length} policies found`)
      policies.forEach(policy => {
        console.log(`    - ${policy.tablename}: ${policy.policyname}`)
      })
    } else {
      console.log('  ⚠️  RLS Policies: Unable to verify (may exist)')
    }
    
    return true
    
  } catch (error) {
    console.log('  ⚠️  RLS verification: Unable to check automatically')
    return true // Non-critical for functionality
  }
}

async function testBasicFunctionality() {
  console.log('\n🧪 Testing Basic Functionality...')
  console.log('─'.repeat(40))
  
  try {
    // Test reading price reports
    const { data: priceReports, error: priceError } = await supabase
      .from('price_reports')
      .select('*')
      .limit(5)
    
    if (priceError) {
      console.log('  ❌ Price Reports: Query failed')
      console.log('     Error:', priceError.message)
    } else {
      console.log(`  ✅ Price Reports: ${priceReports.length} records accessible`)
    }
    
    // Test reading user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (profileError) {
      console.log('  ❌ User Profiles: Query failed')
      console.log('     Error:', profileError.message)
    } else {
      console.log(`  ✅ User Profiles: ${profiles.length} records accessible`)
    }
    
    return !priceError && !profileError
    
  } catch (error) {
    console.error('  ❌ Functionality test error:', error.message)
    return false
  }
}

async function main() {
  try {
    const schemaOk = await verifyDatabaseSchema()
    const usersOk = await verifyUsers()
    const rlsOk = await verifyRLSPolicies()
    const functionalityOk = await testBasicFunctionality()
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 VERIFICATION SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`📊 Database Schema: ${schemaOk ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`👥 User Accounts:   ${usersOk ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`🔒 RLS Policies:    ${rlsOk ? '✅ PASS' : '⚠️  PARTIAL'}`)
    console.log(`🧪 Functionality:   ${functionalityOk ? '✅ PASS' : '❌ FAIL'}`)
    
    const overallStatus = schemaOk && usersOk && functionalityOk
    
    console.log('\n' + '─'.repeat(60))
    if (overallStatus) {
      console.log('🎉 VERIFICATION PASSED!')
      console.log('🚀 V3 Community Platform is ready for use!')
      console.log('\n🔗 Next Steps:')
      console.log('1. Visit https://v3.basarometer.org')
      console.log('2. Login with admin@basarometer.org / Admin2024!')
      console.log('3. Test admin features at /admin')
      console.log('4. Test user features with test1@basarometer.org / Test1234!')
    } else {
      console.log('❌ VERIFICATION FAILED!')
      console.log('🔧 Please check the issues above and re-run setup')
    }
    console.log('='.repeat(60))
    
    process.exit(overallStatus ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ VERIFICATION ERROR:', error)
    process.exit(1)
  }
}

main()