-- Add Streak skill and remove Health/Strength skills
-- This migration adds the new Streak skill and removes Health and Strength

/* --------------------------------------------------------------------
   UPDATE PETS TABLE - Add streak, remove health and strength
   ------------------------------------------------------------------*/
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;

ALTER TABLE public.pets 
DROP COLUMN IF EXISTS health,
DROP COLUMN IF EXISTS strength;

/* --------------------------------------------------------------------
   UPDATE SKILL EVENTS TABLE - Add streak delta, remove health and strength deltas
   ------------------------------------------------------------------*/
ALTER TABLE public.skill_events 
ADD COLUMN IF NOT EXISTS delta_streak integer NOT NULL DEFAULT 0;

ALTER TABLE public.skill_events 
DROP COLUMN IF EXISTS delta_health,
DROP COLUMN IF EXISTS delta_strength;

/* --------------------------------------------------------------------
   UPDATE SKILL BOOSTS TABLE - Add streak boost, remove health and strength boosts
   ------------------------------------------------------------------*/
ALTER TABLE public.skill_boosts 
ADD COLUMN IF NOT EXISTS streak_boost integer NOT NULL DEFAULT 0;

ALTER TABLE public.skill_boosts 
DROP COLUMN IF EXISTS health_boost,
DROP COLUMN IF EXISTS strength_boost;

/* --------------------------------------------------------------------
   UPDATE SKILL BOOSTS DATA - Update existing records with new streak boost values
   ------------------------------------------------------------------*/
-- Clear existing data and insert new boost configurations
DELETE FROM public.skill_boosts;

INSERT INTO public.skill_boosts (category, data_type, social_boost, trivia_boost, science_boost, code_boost, trenches_boost, streak_boost) VALUES
-- Social category
('social', 'text', 3, 0, 0, 0, 0, 1),
('social', 'url', 2, 0, 0, 0, 0, 1),
('social', 'file', 4, 0, 0, 0, 0, 2),

-- Trivia category
('trivia', 'text', 0, 3, 0, 0, 0, 1),
('trivia', 'url', 0, 2, 0, 0, 0, 1),
('trivia', 'file', 0, 4, 0, 0, 0, 2),

-- Science category
('science', 'text', 0, 1, 3, 0, 0, 1),
('science', 'url', 0, 0, 2, 0, 0, 1),
('science', 'file', 0, 0, 4, 0, 0, 2),

-- Code category
('code', 'text', 0, 0, 1, 3, 0, 1),
('code', 'url', 1, 0, 0, 2, 0, 1),
('code', 'file', 0, 0, 0, 4, 0, 2),

-- Trenches category
('trenches', 'text', 1, 0, 0, 0, 3, 1),
('trenches', 'url', 2, 0, 0, 0, 2, 1),
('trenches', 'file', 0, 0, 0, 0, 4, 2),

-- General category
('general', 'text', 0, 0, 0, 0, 0, 2),
('general', 'url', 1, 0, 0, 0, 0, 1),
('general', 'file', 0, 0, 0, 0, 0, 3)
ON CONFLICT (category, data_type) DO NOTHING;

/* --------------------------------------------------------------------
   UPDATE FUNCTION TO HANDLE NEW SKILL STRUCTURE
   ------------------------------------------------------------------*/
CREATE OR REPLACE FUNCTION public.update_pet_skills_from_data()
RETURNS TRIGGER AS $$
DECLARE
    boost_record RECORD;
    data_type_val text;
BEGIN
    -- Determine data type based on content_type or metadata
    IF NEW.content_type = 'url' THEN
        data_type_val := 'url';
    ELSIF NEW.content_type IN ('file', 'application/pdf', 'image/jpeg', 'image/png') THEN
        data_type_val := 'file';
    ELSE
        data_type_val := 'text';
    END IF;

    -- Get the skill boosts for this category and data type
    SELECT * INTO boost_record
    FROM public.skill_boosts
    WHERE category = NEW.category AND data_type = data_type_val;

    -- If we found a boost record, update the pet
    IF boost_record IS NOT NULL THEN
        UPDATE public.pets
        SET 
            social = GREATEST(0, social + boost_record.social_boost),
            trivia = GREATEST(0, trivia + boost_record.trivia_boost),
            science = GREATEST(0, science + boost_record.science_boost),
            code = GREATEST(0, code + boost_record.code_boost),
            trenches = GREATEST(0, trenches + boost_record.trenches_boost),
            streak = GREATEST(0, streak + boost_record.streak_boost)
        WHERE id = NEW.pet_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 