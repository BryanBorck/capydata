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
    skillEvent.delta_social || 0,
    skillEvent.delta_streak || 0
  )

  return data
}

export async function getSkillEventsByPet(petId: string, limit = 10) {
  const { data, error } = await supabase
    .from('skill_events')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getSkillEventsBySource(source: string, limit = 50) {
  const { data, error } = await supabase
    .from('skill_events')
    .select('*')
    .eq('source', source)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Helper function to create skill events from different sources
export async function processTwitterActivity(petId: string, twitterData: any) {
  const skillEvent: SkillEventInsert = {
    pet_id: petId,
    source: 'twitter',
    delta_social: 5, // Twitter activity increases social
    delta_streak: 1, // Also increases streak
    raw_data: twitterData,
    comment: 'Twitter activity detected'
  }

  return createSkillEvent(skillEvent)
}

export async function processDataActivity(petId: string, activityData: any) {
  const skillEvent: SkillEventInsert = {
    pet_id: petId,
    source: 'data_activity',
    delta_social: 2, // Data activity increases social
    delta_streak: 1, // And maintains streak
    raw_data: activityData,
    comment: 'Data activity detected'
  }

  return createSkillEvent(skillEvent)
} 