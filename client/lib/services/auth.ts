import { supabase } from '../supabase/client'
import { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export interface UserData {
  wallet_address: string
  username: string
  created_at: string
}

export interface AuthState {
  user: UserData | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Create or update user profile in Supabase
export async function createOrUpdateProfile(userData: {
  wallet_address: string
  username: string
}): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      wallet_address: userData.wallet_address,
      username: userData.username
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating/updating profile:', error)
    throw error
  }

  return data
}

// Get user profile by ID
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null
    }
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

// Get user profile by wallet address
export async function getProfileByWallet(walletAddress: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null
    }
    console.error('Error fetching profile by wallet:', error)
    throw error
  }

  return data
}

// Create user session after successful wallet authentication
export async function createUserSession(walletAddress: string, username?: string): Promise<UserData> {
  try {
    // Check if user already exists
    let profile = await getProfileByWallet(walletAddress)
    
    if (!profile) {
      // Create new profile
      profile = await createOrUpdateProfile({
        wallet_address: walletAddress,
        username: username || `user_${walletAddress.slice(-6)}`
      })
    } else if (username && profile.username !== username) {
      // Update username if provided and different
      profile = await createOrUpdateProfile({
        wallet_address: walletAddress,
        username: username
      })
    }

    return {
      wallet_address: profile.wallet_address,
      username: profile.username,
      created_at: profile.created_at
    }
  } catch (error) {
    console.error('Error creating user session:', error)
    throw error
  }
} 