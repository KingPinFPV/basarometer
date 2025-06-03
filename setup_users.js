// Setup script for predefined users in Supabase Auth
// This script creates the admin and test users needed for V3 community platform

import { createClient } from '@supabase/supabase-js'

// This would use your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('You need to set:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Settings > API)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const predefinedUsers = [
  {
    email: 'admin@basarometer.org',
    password: 'password123',
    fullName: 'בשרומטר מנהל',
    isAdmin: true
  },
  {
    email: 'admintest1@basarometer.org',
    password: 'password123',
    fullName: 'מנהל בדיקות 1',
    isAdmin: true
  },
  {
    email: 'admintest2@basarometer.org',
    password: 'password123',
    fullName: 'מנהל בדיקות 2',
    isAdmin: true
  },
  {
    email: 'test1@basarometer.org',
    password: 'password123',
    fullName: 'משתמש בדיקות 1',
    isAdmin: false
  },
  {
    email: 'test2@basarometer.org',
    password: 'password123',
    fullName: 'משתמש בדיקות 2',
    isAdmin: false
  }
]

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`)
    
    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName
      }
    })
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  ✓ User ${userData.email} already exists`)
        return
      }
      throw authError
    }
    
    console.log(`  ✓ Auth user created for ${userData.email}`)
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        full_name: userData.fullName,
        is_admin: userData.isAdmin
      })
    
    if (profileError) {
      if (!profileError.message.includes('duplicate key')) {
        throw profileError
      }
      console.log(`  ✓ Profile already exists for ${userData.email}`)
    } else {
      console.log(`  ✓ Profile created for ${userData.email}`)
    }
    
    console.log(`✅ Successfully set up user: ${userData.email}`)
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message)
  }
}

async function setupDatabase() {
  console.log('🗄️ Setting up database enhancements...')
  
  try {
    // Read and execute the database enhancement SQL
    const fs = await import('fs')
    const path = await import('path')
    
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'database_enhancements.sql'),
      'utf8'
    )
    
    // Split by statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
        try {
          await supabase.rpc('exec_sql', { sql: statement })
          console.log('  ✓ Executed SQL statement')
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`  ⚠️ SQL Warning: ${error.message}`)
          }
        }
      }
    }
    
    console.log('✅ Database setup completed')
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message)
    console.log('Please run the database_enhancements.sql file manually in your Supabase SQL editor')
  }
}

async function main() {
  console.log('🚀 Starting V3 Community Platform Setup')
  console.log('=====================================')
  
  // Setup database first
  await setupDatabase()
  
  console.log('\n👥 Creating predefined users...')
  
  // Create all users
  for (const userData of predefinedUsers) {
    await createUser(userData)
  }
  
  console.log('\n✅ Setup completed successfully!')
  console.log('\nYou can now:')
  console.log('1. Login with any of the created accounts')
  console.log('2. Admin users can access /admin for management')
  console.log('3. All users can report prices with advanced details')
  console.log('4. Users can manage their profiles at /profile')
  console.log('\nTest credentials:')
  console.log('- admin@basarometer.org / password123 (Admin)')
  console.log('- test1@basarometer.org / password123 (User)')
}

main().catch(console.error)