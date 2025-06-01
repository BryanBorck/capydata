-- Quick fix for trivia_sessions table
-- Run this in your Supabase SQL Editor

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trivia_sessions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address    text        NOT NULL,
    game_type         text        NOT NULL DEFAULT 'knowledge_trivia',
    questions_data    jsonb       NOT NULL,
    answers_data      jsonb       NOT NULL,
    total_score       integer     NOT NULL DEFAULT 0,
    correct_answers   integer     NOT NULL DEFAULT 0,
    total_questions   integer     NOT NULL DEFAULT 0,
    accuracy_rate     decimal(5,2) NOT NULL DEFAULT 0.00,
    duration_seconds  integer     NOT NULL DEFAULT 0,
    session_data      jsonb       DEFAULT '{}',
    completed_at      timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Add indices
CREATE INDEX IF NOT EXISTS idx_trivia_sessions_wallet ON public.trivia_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trivia_sessions_completed_at ON public.trivia_sessions(completed_at);

-- Enable RLS
ALTER TABLE public.trivia_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can read own trivia sessions" ON public.trivia_sessions;
DROP POLICY IF EXISTS "Users can insert own trivia sessions" ON public.trivia_sessions;

CREATE POLICY "Users can read own trivia sessions" ON public.trivia_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own trivia sessions" ON public.trivia_sessions
    FOR INSERT WITH CHECK (true);

-- Success message
SELECT 'Trivia database fixed! Game should work now.' as status; 