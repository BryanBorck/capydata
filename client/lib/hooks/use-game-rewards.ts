import { useState, useEffect } from 'react';
import { useUser } from '@/providers/user-provider';
import { awardGameReward, GameReward } from '@/lib/services/game-rewards';
import { toast } from 'sonner';

export function useGameRewards(gameId: string, reward: GameReward) {
  const [rewardsAwarded, setRewardsAwarded] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  
  const { user, pets, refreshUserData } = useUser();
  
  // Get active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };
  
  const activePetId = getActivePetId();
  const selectedPet = pets.find(pet => pet.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  const awardRewards = async () => {
    if (rewardsAwarded || isAwarding || !user || !selectedPet) {
      return;
    }

    setIsAwarding(true);
    
    try {
      await awardGameReward(
        user.wallet_address,
        selectedPet.id,
        reward,
        gameId
      );
      
      setRewardsAwarded(true);
      
      // Refresh user data to show updated points
      await refreshUserData();
      
      const rewardText = `+${reward.points} Points, +${reward.skillValue} ${reward.skill.charAt(0).toUpperCase() + reward.skill.slice(1)}`;
      toast.success(`${rewardText} awarded!`);
    } catch (error) {
      console.error('Error awarding rewards:', error);
      toast.error('Failed to award rewards. Please try again.');
    } finally {
      setIsAwarding(false);
    }
  };

  const resetRewards = () => {
    setRewardsAwarded(false);
    setIsAwarding(false);
  };

  return {
    rewardsAwarded,
    isAwarding,
    awardRewards,
    resetRewards,
    canAward: !!user && !!selectedPet
  };
} 