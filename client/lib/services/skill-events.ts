import { supabase } from '../supabase/client'
import { Database } from '../types/database'
import { updatePetStats } from './pets'

type SkillEvent = Database['public']['Tables']['skill_events']['Row']
type SkillEventInsert = Database['public']['Tables']['skill_events']['Insert']

export async function createSkillEvent(skillEvent: SkillEventInsert) {
  const { data, error } = await supabase
    .from('skill_events')
    .insert(skillEvent)
    .select()
    .single()

  if (error) throw error
  
  // Update pet stats based on the skill event
  await updatePetStats(
    skillEvent.pet_id,
    skillEvent.delta_health || 0,
    skillEvent.delta_strength || 0,
    skillEvent.delta_social || 0
  )

  return data
}

export async function getSkillEventsByPet(petId: string) {
  const { data, error } = await supabase
    .from('skill_events')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSkillEventsBySource(petId: string, source: string) {
  const { data, error } = await supabase
    .from('skill_events')
    .select('*')
    .eq('pet_id', petId)
    .eq('source', source)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Helper function to create skill events from different sources
export async function processTwitterActivity(petId: string, twitterData: any) {
  const skillEvent: SkillEventInsert = {
    pet_id: petId,
    source: 'twitter',
    delta_health: 0,
    delta_strength: 0,
    delta_social: 5, // Twitter activity increases social
    raw_data: twitterData,
    comment: 'Twitter activity detected'
  }

  return createSkillEvent(skillEvent)
}

export async function processFitbitActivity(petId: string, fitbitData: any) {
  const skillEvent: SkillEventInsert = {
    pet_id: petId,
    source: 'fitbit',
    delta_health: 5, // Physical activity increases health
    delta_strength: 3, // And strength
    delta_social: 0,
    raw_data: fitbitData,
    comment: 'Physical activity detected'
  }

  return createSkillEvent(skillEvent)
} 