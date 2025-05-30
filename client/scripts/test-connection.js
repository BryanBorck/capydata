// Simple script to test Supabase connection
// Run with: node scripts/test-connection.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey || supabaseKey === 'your-anon-key-here') {
  console.error('❌ Please update your .env.local file with your actual Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔌 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Test basic connection by trying to select from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      if (error.message.includes('relation "profiles" does not exist') || 
          error.message.includes('table "public.profiles" does not exist')) {
        console.log('💡 Hint: You need to run the database schema first!')
        console.log('   Go to: https://supabase.com/dashboard/project/ijbldfrnlpcvzsqkqvkg/sql/new')
        console.log('   Copy/paste the content from: supabase/migrations/20240101000000_initial_schema.sql')
      }
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('✅ Database schema is ready!')
      console.log(`📊 Found ${data.length} profiles in the database`)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

testConnection() 