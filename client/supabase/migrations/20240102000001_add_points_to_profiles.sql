-- Add points column to profiles table for game rewards system
-- This allows users to accumulate points from playing games

ALTER TABLE public.profiles 
ADD COLUMN points integer NOT NULL DEFAULT 0;

-- Add index for performance on points queries
CREATE INDEX idx_profiles_points ON public.profiles(points);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.points IS 'Total points earned by user from games and activities'; 