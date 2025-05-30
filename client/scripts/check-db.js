require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('🔍 Checking database connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Try to create a test profile
    console.log('🧪 Testing profile creation...')
    const testWallet = 'test_wallet_' + Date.now()
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        wallet_address: testWallet,
        username: 'test_user'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Profile creation failed:', createError)
      return
    }
    
    console.log('✅ Profile creation successful:', newProfile)
    
    // Clean up test data
    await supabase.from('profiles').delete().eq('wallet_address', testWallet)
    console.log('✅ Test cleanup completed')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDatabase() 