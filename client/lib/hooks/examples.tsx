import React, { useEffect } from 'react';
import { useDatagotchiFetch } from './use-datagotchi-fetch';
import { DatagotchiSuspense } from '@/components/ui/datagotchi-suspense';
import { Database } from '@/lib/types/database';

type Pet = Database['public']['Tables']['pets']['Row'];

// Example 1: Simple pet fetching with suspense
export const PetListExample = ({ walletAddress }: { walletAddress: string }) => {
  const { fetchPetsByOwner, data: pets, loading, error } = useDatagotchiFetch({ useCache: true });

  useEffect(() => {
    if (walletAddress) {
      fetchPetsByOwner(walletAddress);
    }
  }, [walletAddress, fetchPetsByOwner]);

  return (
    <DatagotchiSuspense loading={loading} error={error} data={!!pets}>
      <DatagotchiSuspense.Skeleton>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </DatagotchiSuspense.Skeleton>

      <DatagotchiSuspense.Error>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800">Failed to load pets</h3>
          <p className="text-red-600">Please try again later.</p>
        </div>
      </DatagotchiSuspense.Error>

      <DatagotchiSuspense.NoData>
        <div className="text-center p-8">
          <p className="text-muted-foreground">No pets found. Create your first pet!</p>
        </div>
      </DatagotchiSuspense.NoData>

      <DatagotchiSuspense.Data>
        <div className="space-y-4">
          {pets?.map((pet: Pet) => (
            <div key={pet.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{pet.name}</h3>
              <p className="text-sm text-muted-foreground">Rarity: {pet.rarity}</p>
              <div className="flex gap-4 mt-2">
                <span>Trivia: {pet.trivia}</span>
                <span>Streak: {pet.streak}</span>
                <span>Social: {pet.social}</span>
              </div>
            </div>
          ))}
        </div>
      </DatagotchiSuspense.Data>
    </DatagotchiSuspense>
  );
};

// Example 2: Custom query with mutation
export const PetUpdaterExample = ({ petId }: { petId: string }) => {
  const { 
    fetchPetById, 
    updatePetStats, 
    data: pet, 
    loading, 
    error 
  } = useDatagotchiFetch({ useCache: false });

  useEffect(() => {
    if (petId) {
      fetchPetById(petId);
    }
  }, [petId, fetchPetById]);

  const handleFeedPet = async () => {
    if (!pet) return;
    
    try {
      await updatePetStats(petId, {
        trivia: Math.min(100, pet.trivia + 10)
      });
      // Refresh pet data
      await fetchPetById(petId);
    } catch (error) {
      console.error('Failed to feed pet:', error);
    }
  };

  return (
    <DatagotchiSuspense loading={loading} error={error} data={!!pet}>
      <DatagotchiSuspense.Data>
        {pet && (
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-bold mb-4">{pet.name}</h2>
            <div className="space-y-2 mb-4">
              <div>Trivia: {pet.trivia}/100</div>
              <div>Streak: {pet.streak}/100</div>
              <div>Social: {pet.social}/100</div>
            </div>
            <button
              onClick={handleFeedPet}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {loading ? 'Feeding...' : 'Feed Pet (+10 Trivia)'}
            </button>
          </div>
        )}
      </DatagotchiSuspense.Data>
    </DatagotchiSuspense>
  );
};

// Example 3: Using generic query for custom operations
export const LeaderboardExample = () => {
  const { fetchLeaderboard, data: leaderboard, loading, error } = useDatagotchiFetch();

  useEffect(() => {
    fetchLeaderboard(5); // Top 5 pets
  }, [fetchLeaderboard]);

  return (
    <DatagotchiSuspense loading={loading} error={error} data={!!leaderboard}>
      <DatagotchiSuspense.Data>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-4">Top Pets</h3>
          {leaderboard?.map((pet: any, index: number) => (
            <div key={pet.id} className="flex justify-between p-3 border rounded">
              <span>#{index + 1} {pet.name}</span>
              <span className="text-muted-foreground">
                {pet.profiles?.username || 'Unknown'}
              </span>
              <span>🔥 {pet.streak}</span>
            </div>
          ))}
        </div>
      </DatagotchiSuspense.Data>
    </DatagotchiSuspense>
  );
}; 