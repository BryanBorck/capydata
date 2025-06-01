-- Create language progress tracking tables

-- Language progress table to track user progress per language
CREATE TABLE language_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    language TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    current_difficulty TEXT DEFAULT 'beginner' CHECK (current_difficulty IN ('beginner', 'intermediate', 'advanced')),
    total_words_learned INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage with 2 decimal places
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, language)
);

-- Flashcard sessions table to track individual game sessions
CREATE TABLE flashcard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    language TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    total_cards INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    session_data JSONB DEFAULT '{}', -- Store additional session metadata
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned words table to track individual words learned by users
CREATE TABLE learned_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    language TEXT NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    pronunciation TEXT NOT NULL,
    times_seen INTEGER DEFAULT 1,
    times_correct INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0, -- 0-100 scale, increases with correct answers
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_learned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, language, word)
);

-- Indexes for better performance
CREATE INDEX idx_language_progress_wallet_language ON language_progress(wallet_address, language);
CREATE INDEX idx_flashcard_sessions_wallet_language ON flashcard_sessions(wallet_address, language);
CREATE INDEX idx_flashcard_sessions_completed_at ON flashcard_sessions(completed_at DESC);
CREATE INDEX idx_learned_words_wallet_language ON learned_words(wallet_address, language);
CREATE INDEX idx_learned_words_mastery_level ON learned_words(wallet_address, language, mastery_level);
CREATE INDEX idx_learned_words_last_seen ON learned_words(wallet_address, language, last_seen DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER update_language_progress_updated_at 
    BEFORE UPDATE ON language_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learned_words_updated_at 
    BEFORE UPDATE ON learned_words
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE language_progress IS 'Tracks user progress and statistics for each language';
COMMENT ON TABLE flashcard_sessions IS 'Records completed flashcard game sessions';
COMMENT ON TABLE learned_words IS 'Tracks individual words learned by users with mastery levels'; 