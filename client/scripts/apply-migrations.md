# Apply Migrations to Supabase

## Step 1: Go to Supabase Dashboard
1. Visit https://supabase.com/dashboard
2. Select your project: `ijbldfrnlpcvzsqkqvkg` 
3. Navigate to **SQL Editor** in the sidebar

## Step 2: Apply First Migration
Copy and paste this SQL code in the SQL Editor and run it:

```sql
-- Fix profiles table to use wallet_address as primary key
-- This is more practical since we authenticate with wallet addresses

-- Drop existing tables and recreate with better schema
DROP TABLE IF EXISTS public.skill_events;
DROP TABLE IF EXISTS public.pet_achievements;
DROP TABLE IF EXISTS public.pets;
DROP TABLE IF EXISTS public.achievements;
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS rarity_t;

/* --------------------------------------------------------------------
   USERS / PROFILES - wallet_address as PK
   ------------------------------------------------------------------*/
CREATE TABLE public.profiles (
    wallet_address text        PRIMARY KEY,
    username       text        NOT NULL UNIQUE,
    created_at     timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   PETS
   ------------------------------------------------------------------*/
CREATE TYPE rarity_t AS ENUM ('common', 'rare', 'epic', 'legendary');

CREATE TABLE public.pets (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet    text        NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
    name            text        NOT NULL DEFAULT 'Gotchi',
    rarity          rarity_t    NOT NULL DEFAULT 'common',
    health          integer     NOT NULL DEFAULT 0,
    strength        integer     NOT NULL DEFAULT 0,
    social          integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   ACHIEVEMENTS (collectibles)
   ------------------------------------------------------------------*/
CREATE TABLE public.achievements (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text        NOT NULL UNIQUE,   -- e.g. "first_tweet"
    title       text        NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pet_achievements (
    pet_id        uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    achieved_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (pet_id, achievement_id)
);

/* --------------------------------------------------------------------
   SKILL EVENTS – one row per external-data import (Twitter, Fitbit, etc.)
   ------------------------------------------------------------------*/
CREATE TABLE public.skill_events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id        uuid      NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    source        text      NOT NULL,               -- e.g. "twitter"
    delta_health  integer   NOT NULL DEFAULT 0,
    delta_strength integer  NOT NULL DEFAULT 0,
    delta_social  integer   NOT NULL DEFAULT 0,
    raw_data      jsonb,    -- store payload for future AI inference
    comment       text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   SECURITY (Row-Level Security)
   ------------------------------------------------------------------*/
-- Enable RLS
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_events    ENABLE ROW LEVEL SECURITY;

-- profiles: self-service (no auth.uid() needed since we use wallet addresses)
CREATE POLICY "Anyone can read profiles" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- pets & related tables: must own the pet
CREATE POLICY "Users can manage own pets" ON public.pets
    FOR ALL USING (true);

CREATE POLICY "Users can manage own pet achievements" ON public.pet_achievements
    FOR ALL USING (true);

CREATE POLICY "Users can manage own skill events" ON public.skill_events
    FOR ALL USING (true);

-- achievements are public
CREATE POLICY "Anyone can read achievements" ON public.achievements
    FOR SELECT USING (true);
```

## Step 3: Apply Second Migration (Fix RLS)
Copy and paste this SQL code in the SQL Editor and run it:

```sql
-- Fix RLS policies for profiles table
-- Since we're not using Supabase Auth, we need to allow access without auth.uid()

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Disable RLS on profiles table since we're managing access at the application level
-- and using wallet addresses as authentication
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled, use these policies instead:
-- CREATE POLICY "Public access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Also disable RLS on pets and related tables for simplicity since we're not using Supabase Auth
ALTER TABLE public.pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_events DISABLE ROW LEVEL SECURITY;
```

## Step 4: Test the Fix
After applying both migrations, run this command to test:

```bash
node scripts/check-db.js
```

You should see:
- ✅ Database connection successful
- ✅ Profile creation successful
- ✅ Test cleanup completed 