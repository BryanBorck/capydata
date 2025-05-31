import { useDatabaseFetch, UseDatabaseFetchConfig } from './use-database-fetch';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';

type Tables = Database['public']['Tables'];
type Pet = Tables['pets']['Row'];
type Profile = Tables['profiles']['Row'];

interface DatagotchiFetchConfig extends UseDatabaseFetchConfig {
  autoExecute?: boolean;
}

export type { DatagotchiFetchConfig };

export const useDatagotchiFetch = (config?: DatagotchiFetchConfig) => {
  const { loading, data, error, executeQuery, clearCache, reset, isLoading, hasError, hasData } = useDatabaseFetch(config);

  // Generic query executor for custom Supabase operations
  const query = useCallback(
    (queryKey: string, queryFn: () => Promise<any>) => {
      return executeQuery(queryKey, queryFn);
    },
    [executeQuery],
  );

  // Fetch pets by owner
  const fetchPetsByOwner = useCallback(
    (walletAddress: string) => {
      return executeQuery(`pets-${walletAddress}`, async () => {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_wallet', walletAddress)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Pet[];
      });
    },
    [executeQuery],
  );

  // Fetch single pet by ID
  const fetchPetById = useCallback(
    (petId: string) => {
      return executeQuery(`pet-${petId}`, async () => {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();

        if (error) throw error;
        return data as Pet;
      });
    },
    [executeQuery],
  );

  // Fetch profile by wallet address
  const fetchProfileByWallet = useCallback(
    (walletAddress: string) => {
      return executeQuery(`profile-${walletAddress}`, async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (error) throw error;
        return data as Profile;
      });
    },
    [executeQuery],
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    (limit: number = 10) => {
      return executeQuery(`leaderboard-${limit}`, async () => {
        const { data, error } = await supabase
          .from('pets')
          .select(`
            *,
            profiles!pets_owner_wallet_fkey (
              username,
              wallet_address
            )
          `)
          .order('health', { ascending: false })
          .order('strength', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data;
      });
    },
    [executeQuery],
  );

  // Update pet stats
  const updatePetStats = useCallback(
    (petId: string, updates: Partial<Pet>) => {
      return executeQuery(`update-pet-${petId}`, async () => {
        const { data, error } = await supabase
          .from('pets')
          .update(updates)
          .eq('id', petId)
          .select()
          .single();

        if (error) throw error;
        
        // Clear related caches
        clearCache(`pet-${petId}`);
        
        return data as Pet;
      });
    },
    [executeQuery, clearCache],
  );

  // Generic mutation helper for create/update/delete operations
  const mutate = useCallback(
    (mutationKey: string, mutationFn: () => Promise<any>, cachesToClear?: string[]) => {
      return executeQuery(mutationKey, async () => {
        const result = await mutationFn();
        
        // Clear specified caches after mutation
        if (cachesToClear) {
          cachesToClear.forEach(cacheKey => clearCache(cacheKey));
        }
        
        return result;
      });
    },
    [executeQuery, clearCache],
  );

  return {
    // State
    loading,
    data,
    error,
    isLoading,
    hasError,
    hasData,
    
    // Generic methods
    query,
    mutate,
    clearCache,
    reset,
    
    // Specific fetch methods
    fetchPetsByOwner,
    fetchPetById,
    fetchProfileByWallet,
    fetchLeaderboard,
    updatePetStats,
    
    // Supabase client for custom operations
    supabase,
  };
}; 