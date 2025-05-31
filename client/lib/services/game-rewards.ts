import { supabase } from '../supabase/client'
import { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Pet = Database['public']['Tables']['pets']['Row']
type SkillEventInsert = Database['public']['Tables']['skill_events']['Insert']

export interface GameReward {
  points: number
  skill: keyof Pick<Pet, 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'streak'>
  skillValue: number
}

// Award points to user
export async function awardPoints(walletAddress: string, points: number): Promise<void> {
  try {
    // Get current user points
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('wallet_address', walletAddress)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Update user points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        points: (profile.points || 0) + points
      })
      .eq('wallet_address', walletAddress)

    if (updateError) {
      throw updateError
    }

    console.log(`Awarded ${points} points to user ${walletAddress}`)
  } catch (error) {
    console.error('Error awarding points:', error)
    throw error
  }
}

// Award skill points to pet
export async function awardSkillPoints(
  petId: string, 
  skill: keyof Pick<Pet, 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'streak'>, 
  value: number,
  source: string = 'game'
): Promise<void> {
  try {
    // Get current pet stats
    const { data: pet, error: fetchError } = await supabase
      .from('pets')
      .select('social, trivia, science, code, trenches, streak')
      .eq('id', petId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Update pet skill
    const currentValue = (pet[skill] as number) || 0
    const { error: updateError } = await supabase
      .from('pets')
      .update({
        [skill]: currentValue + value
      })
      .eq('id', petId)

    if (updateError) {
      throw updateError
    }

    // Create skill event for tracking
    const skillEvent: SkillEventInsert = {
      pet_id: petId,
      source: source,
      delta_social: skill === 'social' ? value : 0,
      delta_trivia: skill === 'trivia' ? value : 0,
      delta_science: skill === 'science' ? value : 0,
      delta_code: skill === 'code' ? value : 0,
      delta_trenches: skill === 'trenches' ? value : 0,
      delta_streak: skill === 'streak' ? value : 0,
      comment: `Game reward: +${value} ${skill}`
    }

    const { error: eventError } = await supabase
      .from('skill_events')
      .insert([skillEvent])

    if (eventError) {
      console.error('Error creating skill event:', eventError)
      // Don't throw here as the main update succeeded
    }

    console.log(`Awarded ${value} ${skill} points to pet ${petId}`)
  } catch (error) {
    console.error('Error awarding skill points:', error)
    throw error
  }
}

// Award complete game reward (points + skill)
export async function awardGameReward(
  walletAddress: string,
  petId: string,
  reward: GameReward,
  gameId: string
): Promise<void> {
  try {
    await Promise.all([
      awardPoints(walletAddress, reward.points),
      awardSkillPoints(petId, reward.skill, reward.skillValue, `game_${gameId}`)
    ])

    console.log(`Game reward awarded: ${reward.points} points, +${reward.skillValue} ${reward.skill}`)
  } catch (error) {
    console.error('Error awarding game reward:', error)
    throw error
  }
} 