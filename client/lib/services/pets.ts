import { supabase } from '../supabase/client'
import { Database } from '../types/database'

type Pet = Database['public']['Tables']['pets']['Row']
type PetInsert = Database['public']['Tables']['pets']['Insert']
type PetUpdate = Database['public']['Tables']['pets']['Update']

export async function getPetsByOwner(walletAddress: string) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_wallet', walletAddress)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPetById(petId: string) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single()

  if (error) throw error
  return data
}

export async function createPet(
  walletAddress: string, 
  name: string, 
  rarity: string = 'common',
  variant: string = 'default',
  background: string = 'forest'
) {
  const stats = getRarityStats(rarity)
  
  const social = 0
  const trivia = 0
  const science = 0
  const code = 0
  const trenches = 0
  const streak = 0

  const { data, error } = await supabase
    .from('pets')
    .insert({
      owner_wallet: walletAddress,
      name,
      rarity,
      variant,     // Uncommented to save variant
      background,  // Uncommented to save background
      social,
      trivia,
      science,
      code,
      trenches,
      streak
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePet(petId: string, updates: PetUpdate) {
  const { data, error } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', petId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePet(petId: string) {
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId)

  if (error) throw error
}

export async function updatePetStats(petId: string, deltaSocial: number, deltaStreak: number = 0) {
  // First get current stats
  const currentPet = await getPetById(petId)
  
  // Calculate new stats (ensure they don't go below 0)
  const newSocial = Math.max(0, currentPet.social + deltaSocial)
  const newStreak = Math.max(0, currentPet.streak + deltaStreak)

  return updatePet(petId, {
    social: newSocial,
    streak: newStreak
  })
}

// Helper to get rarity-based stats
function getRarityStats(rarity: string) {
  const baseStats = {
    common: { min: 5, max: 15 },
    rare: { min: 10, max: 25 },
    epic: { min: 20, max: 35 },
    legendary: { min: 30, max: 50 }
  }
  
  return baseStats[rarity as keyof typeof baseStats] || baseStats.common
}

// Helper to create a pet with random stats
export async function createRandomPet(
  walletAddress: string, 
  name?: string, 
  variant?: string, 
  background?: string
) {
  const rarities: ('common' | 'rare' | 'epic' | 'legendary')[] = ['common', 'rare', 'epic', 'legendary']
  const weights = [70, 20, 8, 2] // Percentage chance for each rarity
  
  // Generate random rarity based on weights
  const random = Math.random() * 100
  let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'
  let cumulative = 0
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (random <= cumulative) {
      rarity = rarities[i]
      break
    }
  }

  return createPet(
    walletAddress, 
    name || 'Gotchi', 
    rarity,
    variant || 'default',
    background || 'forest'
  )
} 