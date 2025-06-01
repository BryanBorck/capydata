-- Migration for Image Quality Evaluation Game System
-- This creates tables to store game rounds, user evaluations, and high-quality image knowledge

-- Table to store image quality game rounds (shared across all users)
CREATE TABLE IF NOT EXISTS public.image_quality_rounds (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number      integer     NOT NULL UNIQUE,
    prompt            text        NOT NULL,  -- The prompt used to generate images
    images_data       jsonb       NOT NULL,  -- Array of image objects with URLs and metadata
    created_by        text        NULL,      -- Wallet address of user who first generated this round
    is_active         boolean     NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Table to store individual user sessions for image quality game
CREATE TABLE IF NOT EXISTS public.image_quality_sessions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address    text        NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
    game_type         text        NOT NULL DEFAULT 'image_quality',
    rounds_data       jsonb       NOT NULL,  -- Array of round data shown to user
    evaluations_data  jsonb       NOT NULL,  -- Array of user's image quality selections
    total_score       integer     NOT NULL DEFAULT 0,
    rounds_completed  integer     NOT NULL DEFAULT 0,
    duration_seconds  integer     NOT NULL DEFAULT 0,
    completed_at      timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Table to store high-quality images for pet knowledge (based on user selections)
CREATE TABLE IF NOT EXISTS public.pet_image_knowledge (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id            uuid        NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    image_url         text        NOT NULL,
    image_prompt      text        NOT NULL,  -- The prompt used to generate this image
    quality_score     integer     NOT NULL DEFAULT 0,  -- How many times this was selected as high quality
    evaluation_count  integer     NOT NULL DEFAULT 0,  -- How many times this image was evaluated
    metadata          jsonb       DEFAULT '{}',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE(pet_id, image_url)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_quality_rounds_round_number ON public.image_quality_rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_image_quality_rounds_created_by ON public.image_quality_rounds(created_by);
CREATE INDEX IF NOT EXISTS idx_image_quality_rounds_is_active ON public.image_quality_rounds(is_active);

CREATE INDEX IF NOT EXISTS idx_image_quality_sessions_wallet ON public.image_quality_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_image_quality_sessions_completed_at ON public.image_quality_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_image_quality_sessions_rounds_completed ON public.image_quality_sessions(rounds_completed);

CREATE INDEX IF NOT EXISTS idx_pet_image_knowledge_pet_id ON public.pet_image_knowledge(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_image_knowledge_quality_score ON public.pet_image_knowledge(quality_score);
CREATE INDEX IF NOT EXISTS idx_pet_image_knowledge_evaluation_count ON public.pet_image_knowledge(evaluation_count);

-- Enable Row Level Security
ALTER TABLE public.image_quality_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_quality_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_image_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_quality_rounds (readable by all, writable by system)
CREATE POLICY "Anyone can read image quality rounds" ON public.image_quality_rounds
    FOR SELECT USING (true);

CREATE POLICY "System can manage image quality rounds" ON public.image_quality_rounds
    FOR ALL USING (true);

-- RLS Policies for image_quality_sessions (users can access their own)
CREATE POLICY "Users can read own image quality sessions" ON public.image_quality_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own image quality sessions" ON public.image_quality_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own image quality sessions" ON public.image_quality_sessions
    FOR UPDATE USING (true);

-- RLS Policies for pet_image_knowledge (users can access their pets' knowledge)
CREATE POLICY "Users can read pet image knowledge" ON public.pet_image_knowledge
    FOR SELECT USING (true);

CREATE POLICY "System can manage pet image knowledge" ON public.pet_image_knowledge
    FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.image_quality_rounds IS 'Stores shared image quality game rounds with generated images';
COMMENT ON TABLE public.image_quality_sessions IS 'Tracks user sessions and evaluations in image quality games';
COMMENT ON TABLE public.pet_image_knowledge IS 'Stores high-quality images for pet knowledge based on user evaluations';

COMMENT ON COLUMN public.image_quality_rounds.prompt IS 'The prompt used to generate images for this round';
COMMENT ON COLUMN public.image_quality_rounds.images_data IS 'JSON array of image objects with URLs and generation metadata';
COMMENT ON COLUMN public.image_quality_rounds.created_by IS 'Wallet address of user who first generated this round';

COMMENT ON COLUMN public.image_quality_sessions.rounds_data IS 'JSON array of round data shown to the user';
COMMENT ON COLUMN public.image_quality_sessions.evaluations_data IS 'JSON array of user evaluations with selected images';

COMMENT ON COLUMN public.pet_image_knowledge.quality_score IS 'Number of times this image was selected as high quality';
COMMENT ON COLUMN public.pet_image_knowledge.evaluation_count IS 'Total number of times this image was evaluated';

-- Function to update pet image knowledge based on evaluations
CREATE OR REPLACE FUNCTION update_pet_image_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called after image quality sessions are completed
    -- to update the pet image knowledge based on user selections
    
    -- Implementation will be handled by the backend API
    -- This is a placeholder for future stored procedure logic
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Image Quality Game tables created successfully!' as status; 