-- Add new skill categories to pets
-- Social - Twitter posts
-- Trivia - Play Trivia and add knowledge  
-- Science - Add arXiv papers
-- Code - Add GitHub repos or docs
-- Trenches - Add crypto related info

/* --------------------------------------------------------------------
   UPDATE PETS TABLE - Add new skill columns
   ------------------------------------------------------------------*/
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS trivia integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS science integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS code integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trenches integer NOT NULL DEFAULT 0;

/* --------------------------------------------------------------------
   UPDATE SKILL EVENTS TABLE - Add new skill deltas
   ------------------------------------------------------------------*/
ALTER TABLE public.skill_events 
ADD COLUMN IF NOT EXISTS delta_trivia integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delta_science integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delta_code integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delta_trenches integer NOT NULL DEFAULT 0;

/* --------------------------------------------------------------------
   ADD DATA CATEGORIES ENUM
   ------------------------------------------------------------------*/
CREATE TYPE data_category_t AS ENUM (
  'social', 'trivia', 'science', 'code', 'trenches', 'general'
);

/* --------------------------------------------------------------------
   UPDATE DATAINSTANCES TABLE - Add category/tag column
   ------------------------------------------------------------------*/
ALTER TABLE public.datainstances 
ADD COLUMN IF NOT EXISTS category data_category_t NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

/* --------------------------------------------------------------------
   UPDATE KNOWLEDGE TABLE - Add category/tag column
   ------------------------------------------------------------------*/
ALTER TABLE public.knowledge 
ADD COLUMN IF NOT EXISTS category data_category_t NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

/* --------------------------------------------------------------------
   CREATE SKILL BOOSTS TABLE - Define how different categories boost skills
   ------------------------------------------------------------------*/
CREATE TABLE IF NOT EXISTS public.skill_boosts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category data_category_t NOT NULL,
    data_type text NOT NULL, -- 'text', 'url', 'file'
    health_boost integer NOT NULL DEFAULT 0,
    strength_boost integer NOT NULL DEFAULT 0,
    social_boost integer NOT NULL DEFAULT 0,
    trivia_boost integer NOT NULL DEFAULT 0,
    science_boost integer NOT NULL DEFAULT 0,
    code_boost integer NOT NULL DEFAULT 0,
    trenches_boost integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(category, data_type)
);

/* --------------------------------------------------------------------
   INSERT DEFAULT SKILL BOOSTS
   ------------------------------------------------------------------*/
INSERT INTO public.skill_boosts (category, data_type, health_boost, strength_boost, social_boost, trivia_boost, science_boost, code_boost, trenches_boost) VALUES
-- Social category
('social', 'text', 0, 0, 3, 0, 0, 0, 0),
('social', 'url', 1, 0, 2, 0, 0, 0, 0),
('social', 'file', 0, 0, 4, 0, 0, 0, 0),

-- Trivia category
('trivia', 'text', 1, 1, 0, 3, 0, 0, 0),
('trivia', 'url', 0, 1, 0, 2, 0, 0, 0),
('trivia', 'file', 1, 0, 0, 4, 0, 0, 0),

-- Science category
('science', 'text', 0, 1, 0, 1, 3, 0, 0),
('science', 'url', 0, 0, 0, 0, 2, 0, 0),
('science', 'file', 0, 1, 0, 0, 4, 0, 0),

-- Code category
('code', 'text', 0, 2, 0, 0, 1, 3, 0),
('code', 'url', 0, 1, 1, 0, 0, 2, 0),
('code', 'file', 0, 2, 0, 0, 0, 4, 0),

-- Trenches category
('trenches', 'text', 0, 1, 1, 0, 0, 0, 3),
('trenches', 'url', 0, 0, 2, 0, 0, 0, 2),
('trenches', 'file', 0, 1, 0, 0, 0, 0, 4),

-- General category (original behavior)
('general', 'text', 2, 0, 0, 0, 0, 0, 0),
('general', 'url', 1, 0, 1, 0, 0, 0, 0),
('general', 'file', 3, 0, 0, 0, 0, 0, 0)
ON CONFLICT (category, data_type) DO NOTHING;

/* --------------------------------------------------------------------
   CREATE FUNCTION TO AUTO-UPDATE PET SKILLS ON DATA ADDITION
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
            health = GREATEST(0, health + boost_record.health_boost),
            strength = GREATEST(0, strength + boost_record.strength_boost),
            social = GREATEST(0, social + boost_record.social_boost),
            trivia = GREATEST(0, trivia + boost_record.trivia_boost),
            science = GREATEST(0, science + boost_record.science_boost),
            code = GREATEST(0, code + boost_record.code_boost),
            trenches = GREATEST(0, trenches + boost_record.trenches_boost)
        WHERE id = NEW.pet_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* --------------------------------------------------------------------
   CREATE TRIGGER TO AUTO-UPDATE PET SKILLS
   ------------------------------------------------------------------*/
DROP TRIGGER IF EXISTS trg_update_pet_skills ON public.datainstances;
CREATE TRIGGER trg_update_pet_skills
    AFTER INSERT ON public.datainstances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pet_skills_from_data(); 