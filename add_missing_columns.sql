-- Add missing skill columns to pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS trivia integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS science integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS code integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trenches integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;

-- Also add variant and background columns if they don't exist
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS variant text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS background text DEFAULT 'forest'; 