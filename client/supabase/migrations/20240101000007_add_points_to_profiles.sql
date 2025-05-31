-- Add points column to profiles table
-- This migration adds a points system to track user currency

-- Add points column with default value of 0 for new users (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'points'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN points integer NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Set existing users to 100 points (only those that currently have 0)
UPDATE public.profiles 
SET points = 100 
WHERE points = 0;

-- Add comment to document the column (safe to run multiple times)
COMMENT ON COLUMN public.profiles.points IS 'User points (currency) - new users start with 0, existing users get 100'; 