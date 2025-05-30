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

export async function createPet(pet: PetInsert) {
  const { data, error } = await supabase
    .from('pets')
    .insert(pet)
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

export async function updatePetStats(petId: string, deltaHealth: number, deltaStrength: number, deltaSocial: number) {
  // First get current stats
  const currentPet = await getPetById(petId)
  
  // Calculate new stats (ensure they don't go below 0)
  const newHealth = Math.max(0, currentPet.health + deltaHealth)
  const newStrength = Math.max(0, currentPet.strength + deltaStrength)
  const newSocial = Math.max(0, currentPet.social + deltaSocial)

  return updatePet(petId, {
    health: newHealth,
    strength: newStrength,
    social: newSocial
  })
}

// Helper to create a pet with random stats
export async function createRandomPet(walletAddress: string, name?: string) {
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

  // Generate random stats based on rarity
  const baseStats = {
    common: { min: 5, max: 15 },
    rare: { min: 10, max: 25 },
    epic: { min: 20, max: 35 },
    legendary: { min: 30, max: 50 }
  }

  const stats = baseStats[rarity]
  const health = Math.floor(Math.random() * (stats.max - stats.min + 1)) + stats.min
  const strength = Math.floor(Math.random() * (stats.max - stats.min + 1)) + stats.min
  const social = Math.floor(Math.random() * (stats.max - stats.min + 1)) + stats.min

  return createPet({
    owner_wallet: walletAddress,
    name: name || 'Gotchi',
    rarity,
    health,
    strength,
    social
  })
} 