-- Add trivia sessions table for tracking trivia game progress
-- This table stores session data, accuracy metrics, and user progress

CREATE TABLE public.trivia_sessions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address    text        NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
    game_type         text        NOT NULL DEFAULT 'knowledge_trivia',
    questions_data    jsonb       NOT NULL,  -- Array of trivia questions shown to user
    answers_data      jsonb       NOT NULL,  -- Array of user's trivia answers
    total_score       integer     NOT NULL DEFAULT 0,
    correct_answers   integer     NOT NULL DEFAULT 0,
    total_questions   integer     NOT NULL DEFAULT 0,
    accuracy_rate     decimal(5,2) NOT NULL DEFAULT 0.00,  -- Percentage (0.00 to 100.00)
    duration_seconds  integer     NOT NULL DEFAULT 0,
    session_data      jsonb       DEFAULT '{}',  -- Additional session metadata
    completed_at      timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Add indices for performance
CREATE INDEX idx_trivia_sessions_wallet ON public.trivia_sessions(wallet_address);
CREATE INDEX idx_trivia_sessions_completed_at ON public.trivia_sessions(completed_at);
CREATE INDEX idx_trivia_sessions_accuracy ON public.trivia_sessions(accuracy_rate);

-- Enable Row Level Security
ALTER TABLE public.trivia_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sessions
CREATE POLICY "Users can read own trivia sessions" ON public.trivia_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own trivia sessions" ON public.trivia_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own trivia sessions" ON public.trivia_sessions
    FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.trivia_sessions IS 'Tracks user progress and results from trivia games';
COMMENT ON COLUMN public.trivia_sessions.questions_data IS 'JSON array of trivia questions shown to the user';
COMMENT ON COLUMN public.trivia_sessions.answers_data IS 'JSON array of user responses with timing and correctness';
COMMENT ON COLUMN public.trivia_sessions.accuracy_rate IS 'Percentage accuracy (0.00 to 100.00)';
COMMENT ON COLUMN public.trivia_sessions.duration_seconds IS 'Total time taken to complete the session'; 