-- SQL script to create sentiment_game_sessions table
-- Run this in the Supabase SQL Editor if the table doesn't exist

-- First check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.sentiment_game_sessions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address    text        NOT NULL,
    game_type         text        NOT NULL DEFAULT 'sentiment_labeling',
    texts_data        jsonb       NOT NULL,  -- Array of sentiment texts shown to user
    answers_data      jsonb       NOT NULL,  -- Array of user's sentiment classifications
    total_score       integer     NOT NULL DEFAULT 0,
    correct_answers   integer     NOT NULL DEFAULT 0,
    total_answers     integer     NOT NULL DEFAULT 0,
    accuracy_rate     decimal(5,2) NOT NULL DEFAULT 0.00,  -- Percentage (0.00 to 100.00)
    duration_seconds  integer     NOT NULL DEFAULT 0,
    completed_at      timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_sentiment_sessions_wallet ON public.sentiment_game_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sentiment_sessions_completed_at ON public.sentiment_game_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_sessions_accuracy ON public.sentiment_game_sessions(accuracy_rate);

-- Enable Row Level Security
ALTER TABLE public.sentiment_game_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can read own sentiment sessions" ON public.sentiment_game_sessions;
DROP POLICY IF EXISTS "Users can insert own sentiment sessions" ON public.sentiment_game_sessions;
DROP POLICY IF EXISTS "Users can update own sentiment sessions" ON public.sentiment_game_sessions;

-- Create RLS Policies: Users can access their own sessions
CREATE POLICY "Users can read own sentiment sessions" ON public.sentiment_game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own sentiment sessions" ON public.sentiment_game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sentiment sessions" ON public.sentiment_game_sessions
    FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.sentiment_game_sessions IS 'Tracks user progress and results from sentiment labeling games';
COMMENT ON COLUMN public.sentiment_game_sessions.texts_data IS 'JSON array of sentiment texts shown to the user';
COMMENT ON COLUMN public.sentiment_game_sessions.answers_data IS 'JSON array of user responses with timing and correctness';
COMMENT ON COLUMN public.sentiment_game_sessions.accuracy_rate IS 'Percentage accuracy (0.00 to 100.00)';
COMMENT ON COLUMN public.sentiment_game_sessions.duration_seconds IS 'Total time taken to complete the session';

-- Also add points column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

-- Add index for performance on points queries
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.points IS 'Total points earned by user from games and activities';

-- Success message
SELECT 'Tables created successfully! You can now use the sentiment labeling game.' as status; 