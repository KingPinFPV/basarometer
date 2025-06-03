#!/usr/bin/env node

// V3 Community Platform User Setup Script
// Creates exactly 5 users with defined roles and passwords
// For Supabase Project: ergxrxtuncymyqslmoen (v3.basarometer.org)

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔑 V3 User Setup & Database Configuration')
console.log('==========================================')
console.log('Project: V3 Israeli Meat Price Community Platform')
console.log('Database: Supabase (ergxrxtuncymyqslmoen)')
console.log('==========================================\n')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validation
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ MISSING SUPABASE CREDENTIALS')
  console.error('Please ensure your .env.local file contains:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://ergxrxtuncymyqslmoen.supabase.co')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  console.error('\nGet service role key from: Supabase Dashboard > Settings > API')
  process.exit(1)
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Define exactly 5 users with specific passwords and roles
const usersToCreate = [
  // 👑 ADMIN USERS (3 users with is_admin: true)
  {
    email: 'admin@basarometer.org',
    password: 'Admin2024!',
    full_name: 'מנהל ראשי בשרומטר',
    is_admin: true,
    city: 'תל אביב',
    phone: '050-1234567'
  },
  {
    email: 'admintest1@basarometer.org', 
    password: 'AdminTest1!',
    full_name: 'מנהל בדיקות ראשון',
    is_admin: true,
    city: 'ירושלים',
    phone: '052-9876543'
  },
  {
    email: 'admintest2@basarometer.org',
    password: 'AdminTest2!', 
    full_name: 'מנהל בדיקות שני',
    is_admin: true,
    city: 'חיפה',
    phone: '054-5555555'
  },
  // 👥 REGULAR USERS (2 users with is_admin: false)
  {
    email: 'test1@basarometer.org',
    password: 'Test1234!',
    full_name: 'משתמש בדיקות ראשון', 
    is_admin: false,
    city: 'פתח תקוה',
    phone: '050-1111111'
  },
  {
    email: 'test2@basarometer.org',
    password: 'Test5678!',
    full_name: 'משתמש בדיקות שני',
    is_admin: false, 
    city: 'באר שבע',
    phone: '052-2222222'
  }
]

// User creation function
async function createUser(userData, index) {
  const userNumber = index + 1
  console.log(`\n[${userNumber}/5] Creating ${userData.is_admin ? 'ADMIN' : 'USER'}: ${userData.email}`)
  console.log('─'.repeat(60))
  
  try {
    // Step 1: Create user in Supabase Auth
    console.log('  🔐 Creating authentication account...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name
      }
    })
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('  ⚠️  User already exists in auth - updating profile...')
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === userData.email)
        
        if (existingUser) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .upsert({
              id: existingUser.id,
              full_name: userData.full_name,
              city: userData.city,
              phone: userData.phone,
              is_admin: userData.is_admin,
              updated_at: new Date().toISOString()
            })
          
          if (updateError) {
            console.error('  ❌ Profile update error:', updateError.message)
            return null
          }
          
          console.log('  ✅ Existing user profile updated')
          return {
            email: userData.email,
            password: userData.password,
            role: userData.is_admin ? 'Admin' : 'User',
            full_name: userData.full_name,
            city: userData.city,
            status: 'updated'
          }
        }
      } else {
        console.error('  ❌ Auth creation error:', authError.message)
        return null
      }
    } else {
      console.log('  ✅ Auth account created successfully')
      
      // Step 2: Create user profile
      console.log('  👤 Creating user profile...')
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          city: userData.city,
          phone: userData.phone,
          is_admin: userData.is_admin,
          reputation_score: 0,
          total_reports: 0
        })
      
      if (profileError) {
        console.error('  ❌ Profile creation error:', profileError.message)
        return null
      }
      
      console.log('  ✅ User profile created successfully')
      
      return {
        email: userData.email,
        password: userData.password,
        role: userData.is_admin ? 'Admin' : 'User',
        full_name: userData.full_name,
        city: userData.city,
        status: 'created'
      }
    }
    
  } catch (error) {
    console.error(`  ❌ Unexpected error for ${userData.email}:`, error.message)
    return null
  }
}

// Main user creation process
async function createAllUsers() {
  console.log('🚀 Starting V3 user creation process...')
  console.log(`📊 Creating ${usersToCreate.length} users (3 admins + 2 regular users)\n`)
  
  const results = []
  
  // Create users sequentially to avoid rate limits
  for (let i = 0; i < usersToCreate.length; i++) {
    const result = await createUser(usersToCreate[i], i)
    if (result) {
      results.push(result)
    }
    
    // Small delay between user creation
    if (i < usersToCreate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// Display results beautifully
function displayResults(createdUsers) {
  console.log('\n' + '='.repeat(80))
  console.log('🎉 V3 COMMUNITY PLATFORM USER CREATION COMPLETE!')
  console.log('='.repeat(80))
  
  // Group by role for better display
  const admins = createdUsers.filter(u => u.role === 'Admin')
  const users = createdUsers.filter(u => u.role === 'User')
  
  console.log('\n📋 LOGIN CREDENTIALS FOR V3.BASAROMETER.ORG:')
  console.log('─'.repeat(60))
  
  if (admins.length > 0) {
    console.log('\n👑 ADMIN USERS (Full Management Access):')
    console.log('═'.repeat(50))
    admins.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.full_name}`)
      console.log(`   📧 Email:    ${user.email}`)
      console.log(`   🔑 Password: ${user.password}`)
      console.log(`   🏙️  City:     ${user.city}`)
      console.log(`   🎯 Access:   Admin Panel + User Features`)
      console.log(`   📊 Status:   ${user.status === 'created' ? 'Newly Created' : 'Updated Existing'}`)
    })
  }
  
  if (users.length > 0) {
    console.log('\n\n👥 REGULAR USERS (Standard Access):')
    console.log('═'.repeat(50))
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.full_name}`)
      console.log(`   📧 Email:    ${user.email}`)
      console.log(`   🔑 Password: ${user.password}`)
      console.log(`   🏙️  City:     ${user.city}`)
      console.log(`   🎯 Access:   Price Reporting + Profile Management`)
      console.log(`   📊 Status:   ${user.status === 'created' ? 'Newly Created' : 'Updated Existing'}`)
    })
  }
  
  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Total users processed: ${createdUsers.length}/${usersToCreate.length}`)
  console.log(`👑 Admin users: ${admins.length}`)
  console.log(`👥 Regular users: ${users.length}`)
  
  console.log('\n🔗 TESTING INSTRUCTIONS:')
  console.log('─'.repeat(30))
  console.log('1. 🌐 Production: https://v3.basarometer.org')
  console.log('2. 💻 Local Dev:  http://localhost:3000')
  console.log('3. 🛠️  Admin Panel: /admin (admin users only)')
  console.log('4. 👤 User Profile: /profile (all users)')
  console.log('5. 📊 Price Reports: Click any price cell to report')
  
  console.log('\n🔧 QUICK TEST SEQUENCE:')
  console.log('─'.repeat(25))
  console.log('1. Login with admin@basarometer.org')
  console.log('2. Navigate to /admin to test admin features')
  console.log('3. Try adding a retailer or product')
  console.log('4. Logout and login with test1@basarometer.org')
  console.log('5. Try reporting a price with sale details')
  console.log('6. Check profile page at /profile')
  
  console.log('\n' + '='.repeat(80))
  console.log('🎯 V3 COMMUNITY PLATFORM IS READY FOR PRODUCTION!')
  console.log('='.repeat(80))
}

// Execute the complete setup
async function main() {
  try {
    const createdUsers = await createAllUsers()
    
    if (createdUsers.length === 0) {
      console.error('\n❌ No users were created successfully')
      process.exit(1)
    }
    
    displayResults(createdUsers)
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    console.error('Please check your Supabase credentials and database setup')
    process.exit(1)
  }
}

// Run the setup
main()