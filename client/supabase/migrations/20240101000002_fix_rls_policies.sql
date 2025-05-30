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