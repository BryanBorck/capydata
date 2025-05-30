# Supabase Setup for Datagotchi

## Local Development Setup (Recommended for Development)

### Prerequisites
- Docker Desktop must be installed and running
- Supabase CLI installed (✅ Already installed)

### Steps

1. **Start Docker Desktop**
   - Make sure Docker Desktop is running on your machine
   - You can verify by running: `docker ps`

2. **Start Supabase locally**
   ```bash
   supabase start
   ```
   This will:
   - Pull necessary Docker images
   - Start local Supabase services (Database, Auth, API, etc.)
   - Apply your database migrations automatically

3. **Access your local Supabase**
   - Database URL: `http://127.0.0.1:54321`
   - Supabase Studio: `http://127.0.0.1:54323`
   - API URL: `http://127.0.0.1:54321`

4. **Your environment variables are already set in `.env.local`**

## Cloud Setup (For Production)

### Steps

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/sign in
   - Create a new project
   - Wait for it to be provisioned (2-3 minutes)

2. **Get your project credentials**
   - Go to Settings > API
   - Copy your Project URL and anon public key

3. **Update environment variables**
   - Replace the values in `.env.local` with your project's credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Apply the database schema**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the content from `supabase/migrations/20240101000000_initial_schema.sql`
   - Run the script

## Database Schema

Your Datagotchi database includes:

### Tables
- `profiles` - User profiles with wallet addresses
- `pets` - Virtual pets with stats (health, strength, social)
- `achievements` - Collectible achievements
- `pet_achievements` - Junction table for pet achievements
- `skill_events` - External data import events (Twitter, Fitbit, etc.)

### Key Features
- Row Level Security (RLS) enabled
- Automatic pet creation when profile is created
- Proper foreign key relationships
- UUID primary keys

## Usage in Your App

The following files have been created for you:

- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/middleware.ts` - Middleware client for session management
- `lib/types/database.ts` - TypeScript types for your database
- `lib/services/pets.ts` - Pet-related database operations
- `lib/services/skill-events.ts` - Skill event operations
- `middleware.ts` - Next.js middleware for session refresh

## Example Usage

```typescript
import { supabase } from '@/lib/supabase/client'
import { getPetsByOwner, createSkillEvent } from '@/lib/services/pets'

// Get user's pets
const pets = await getPetsByOwner(userId)

// Process Twitter activity
await processTwitterActivity(petId, twitterData)
```

## Troubleshooting

### Docker Issues
- Make sure Docker Desktop is running
- Try restarting Docker Desktop
- Check Docker Desktop preferences for any resource limits

### Local Supabase Issues
- Run `supabase stop` and then `supabase start` to restart
- Check `supabase status` to see service status
- Run `supabase logs` to see error logs

### Database Issues
- Verify your migrations are applied: `supabase db diff`
- Reset local database: `supabase db reset` 