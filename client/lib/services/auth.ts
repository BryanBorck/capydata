import { supabase } from '../supabase/client'
import { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export interface UserData {
  wallet_address: string
  username: string
  points: number
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
  points?: number
}): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      wallet_address: userData.wallet_address,
      username: userData.username,
      ...(userData.points !== undefined && { points: userData.points })
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
      points: profile.points,
      created_at: profile.created_at
    }
  } catch (error) {
    console.error('Error creating user session:', error)
    throw error
  }
}

// Delete user account and all associated data
export async function deleteAccount(walletAddress: string): Promise<void> {
  try {
    // First, get all pets owned by this user
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_wallet', walletAddress)

    if (petsError) {
      console.error('Error fetching user pets for deletion:', petsError)
      throw petsError
    }

    if (pets && pets.length > 0) {
      const petIds = pets.map(pet => pet.id)

      // Delete pet-related data in order due to foreign key constraints
      // 1. Delete pet_items
      const { error: petItemsError } = await supabase
        .from('pet_items')
        .delete()
        .in('pet_id', petIds)

      if (petItemsError) {
        console.error('Error deleting pet items:', petItemsError)
        throw petItemsError
      }

      // 2. Delete pet_achievements
      const { error: petAchievementsError } = await supabase
        .from('pet_achievements')
        .delete()
        .in('pet_id', petIds)

      if (petAchievementsError) {
        console.error('Error deleting pet achievements:', petAchievementsError)
        throw petAchievementsError
      }

      // 3. Delete skill_events
      const { error: skillEventsError } = await supabase
        .from('skill_events')
        .delete()
        .in('pet_id', petIds)

      if (skillEventsError) {
        console.error('Error deleting skill events:', skillEventsError)
        throw skillEventsError
      }

      // 4. Delete datainstances and their relationships
      const { data: datainstances, error: datainstancesSelectError } = await supabase
        .from('datainstances')
        .select('id')
        .in('pet_id', petIds)

      if (datainstancesSelectError) {
        console.error('Error fetching datainstances for deletion:', datainstancesSelectError)
        throw datainstancesSelectError
      }

      if (datainstances && datainstances.length > 0) {
        const datainstanceIds = datainstances.map(di => di.id)

        // Delete datainstance relationships
        const { error: datainstanceKnowledgeError } = await supabase
          .from('datainstance_knowledge')
          .delete()
          .in('datainstance_id', datainstanceIds)

        if (datainstanceKnowledgeError) {
          console.error('Error deleting datainstance knowledge relationships:', datainstanceKnowledgeError)
          throw datainstanceKnowledgeError
        }

        const { error: datainstanceImagesError } = await supabase
          .from('datainstance_images')
          .delete()
          .in('datainstance_id', datainstanceIds)

        if (datainstanceImagesError) {
          console.error('Error deleting datainstance images relationships:', datainstanceImagesError)
          throw datainstanceImagesError
        }

        // Delete datainstances
        const { error: datainstancesError } = await supabase
          .from('datainstances')
          .delete()
          .in('pet_id', petIds)

        if (datainstancesError) {
          console.error('Error deleting datainstances:', datainstancesError)
          throw datainstancesError
        }
      }

      // 5. Delete pets
      const { error: petsDeleteError } = await supabase
        .from('pets')
        .delete()
        .eq('owner_wallet', walletAddress)

      if (petsDeleteError) {
        console.error('Error deleting pets:', petsDeleteError)
        throw petsDeleteError
      }
    }

    // 6. Finally, delete the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('wallet_address', walletAddress)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      throw profileError
    }

    console.log('Account successfully deleted for wallet:', walletAddress)
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error
  }
} 