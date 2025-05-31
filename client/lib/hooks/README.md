# Datagotchi Database Fetch Hooks

This directory contains powerful hooks for fetching data from Supabase in your Datagotchi app, along with a suspense component for handling loading states.

## Overview

- **`useDatabaseFetch`** - Base hook for database operations with caching, error handling, and loading states
- **`useDatagotchiFetch`** - App-specific hook with predefined methods for common operations
- **`DatagotchiSuspense`** - React component for handling loading, error, and data states

## Quick Start

```tsx
import { useDatagotchiFetch } from '@/lib/hooks';
import { DatagotchiSuspense } from '@/components/ui/datagotchi-suspense';

function MyComponent() {
  const { fetchPetsByOwner, data: pets, loading, error } = useDatagotchiFetch();

  useEffect(() => {
    fetchPetsByOwner('wallet-address');
  }, []);

  return (
    <DatagotchiSuspense loading={loading} error={error} data={!!pets}>
      <DatagotchiSuspense.Data>
        {pets?.map(pet => (
          <div key={pet.id}>{pet.name}</div>
        ))}
      </DatagotchiSuspense.Data>
    </DatagotchiSuspense>
  );
}
```

## useDatagotchiFetch Hook

### Configuration Options

```tsx
interface DatagotchiFetchConfig {
  useCache?: boolean;        // Enable/disable caching (default: false)
  retryOnError?: boolean;    // Auto-retry on errors (default: false)
  retryDelay?: number;       // Delay between retries in ms (default: 1000)
  autoExecute?: boolean;     // Auto-execute queries (future feature)
}
```

### Available Methods

#### State Properties
- `loading` - Boolean indicating if any operation is in progress
- `data` - The fetched data
- `error` - Any error that occurred
- `isLoading` - Alias for loading
- `hasError` - Boolean indicating if there's an error
- `hasData` - Boolean indicating if data exists

#### Fetch Methods
- `fetchPetsByOwner(walletAddress: string)` - Get all pets for a wallet
- `fetchPetById(petId: string)` - Get a specific pet
- `fetchProfileByWallet(walletAddress: string)` - Get user profile
- `fetchLeaderboard(limit?: number)` - Get top pets with user info

#### Mutation Methods
- `updatePetStats(petId: string, updates: Partial<Pet>)` - Update pet properties
- `mutate(key: string, fn: () => Promise<any>, cachesToClear?: string[])` - Generic mutation

#### Utility Methods
- `query(key: string, fn: () => Promise<any>)` - Execute custom queries
- `clearCache(key?: string)` - Clear specific or all cached data
- `reset()` - Reset the hook state

### Usage Examples

#### Basic Pet Fetching
```tsx
const { fetchPetsByOwner, data: pets, loading } = useDatagotchiFetch({
  useCache: true
});

useEffect(() => {
  fetchPetsByOwner('wallet-address');
}, []);
```

#### Custom Query
```tsx
const { query, data, loading } = useDatagotchiFetch();

const fetchCustomData = () => {
  return query('my-custom-query', async () => {
    const { data } = await supabase
      .from('pets')
      .select('name, health')
      .gt('health', 50);
    return data;
  });
};
```

#### Mutation with Cache Invalidation
```tsx
const { updatePetStats, clearCache } = useDatagotchiFetch();

const feedPet = async (petId: string) => {
  await updatePetStats(petId, { health: 100 });
  // Cache is automatically cleared for this pet
};
```

## DatagotchiSuspense Component

### Props
```tsx
interface DatagotchiSuspenseProps {
  loading?: boolean;                 // Show loading state
  error?: Error | boolean;          // Show error state
  data?: boolean;                   // Show data state
  topMost?: boolean;                // Position loading indicator at top
  enableActivityIndicator?: boolean; // Show loading spinner during updates
  children?: React.ReactNode;
}
```

### Child Components
- `DatagotchiSuspense.Skeleton` - Custom loading skeleton
- `DatagotchiSuspense.Error` - Custom error display
- `DatagotchiSuspense.NoData` - Custom empty state
- `DatagotchiSuspense.Data` - Content when data is available

### Complete Example
```tsx
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
      <h3 className="font-semibold text-red-800">Failed to load</h3>
      <p className="text-red-600">Please try again.</p>
    </div>
  </DatagotchiSuspense.Error>

  <DatagotchiSuspense.NoData>
    <div className="text-center p-8">
      <p>No data found!</p>
    </div>
  </DatagotchiSuspense.NoData>

  <DatagotchiSuspense.Data>
    {pets?.map(pet => (
      <PetCard key={pet.id} pet={pet} />
    ))}
  </DatagotchiSuspense.Data>
</DatagotchiSuspense>
```

## Best Practices

### 1. Use Caching Wisely
```tsx
// For data that doesn't change often
const { fetchLeaderboard } = useDatagotchiFetch({ useCache: true });

// For real-time data
const { fetchPetById } = useDatagotchiFetch({ useCache: false });
```

### 2. Handle Errors Gracefully
```tsx
const { error, fetchPetsByOwner } = useDatagotchiFetch({
  retryOnError: true,
  retryDelay: 2000
});
```

### 3. Clear Cache After Mutations
```tsx
const { updatePetStats, clearCache } = useDatagotchiFetch();

const handleUpdate = async () => {
  await updatePetStats(petId, updates);
  clearCache(`pets-${walletAddress}`); // Clear related cache
};
```

### 4. Use Custom Queries for Complex Operations
```tsx
const { query } = useDatagotchiFetch();

const fetchPetStatistics = () => {
  return query('pet-stats', async () => {
    const { data } = await supabase.rpc('get_pet_statistics');
    return data;
  });
};
```

## TypeScript Support

All hooks are fully typed with your Supabase database schema:

```tsx
import { Database } from '@/lib/types/database';

type Pet = Database['public']['Tables']['pets']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Hooks automatically infer correct types
const { data: pets } = useDatagotchiFetch(); // pets is Pet[] | undefined
```

## Performance Tips

1. **Use caching** for data that doesn't change frequently
2. **Clear specific cache keys** instead of clearing all cache
3. **Batch related operations** using the generic `query` method
4. **Use the loading state** to prevent multiple concurrent requests
5. **Implement proper error boundaries** around components using these hooks 