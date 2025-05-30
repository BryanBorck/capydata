-- Datagotchi – initial Supabase schema
-- Run this whole script in the Supabase SQL editor
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* --------------------------------------------------------------------
   USERS / PROFILES
   ------------------------------------------------------------------*/
-- One-to-one with auth.users (keeps auth flexible; wallet address stored separately)
CREATE TABLE public.profiles (
    id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username      text        NOT NULL UNIQUE,
    wallet_address text       NOT NULL UNIQUE,
    created_at    timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   PETS
   ------------------------------------------------------------------*/
CREATE TYPE rarity_t AS ENUM ('common', 'rare', 'epic', 'legendary');

CREATE TABLE public.pets (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name       text        NOT NULL DEFAULT 'Gotchi',
    rarity     rarity_t    NOT NULL DEFAULT 'common',
    health     integer     NOT NULL DEFAULT 0,
    strength   integer     NOT NULL DEFAULT 0,
    social     integer     NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   ACHIEVEMENTS (collectibles)
   ------------------------------------------------------------------*/
CREATE TABLE public.achievements (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text        NOT NULL UNIQUE,   -- e.g. "first_tweet"
    title       text        NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pet_achievements (
    pet_id        uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    achieved_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (pet_id, achievement_id)
);

/* --------------------------------------------------------------------
   SKILL EVENTS – one row per external-data import (Twitter, Fitbit, etc.)
   ------------------------------------------------------------------*/
CREATE TABLE public.skill_events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id        uuid      NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    source        text      NOT NULL,               -- e.g. "twitter"
    delta_health  integer   NOT NULL DEFAULT 0,
    delta_strength integer  NOT NULL DEFAULT 0,
    delta_social  integer   NOT NULL DEFAULT 0,
    raw_data      jsonb,    -- store payload for future AI inference
    comment       text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

/* --------------------------------------------------------------------
   SECURITY (Row-Level Security)
   ------------------------------------------------------------------*/
-- Enable RLS
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_events    ENABLE ROW LEVEL SECURITY;

-- profiles: self-service
CREATE POLICY "Select own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- pets & related tables: must own the pet
CREATE POLICY "Owner CRUD on pets" ON public.pets
    USING (auth.uid() = owner_id);

CREATE POLICY "Owner CRUD on pet_achievements" ON public.pet_achievements
    USING (auth.uid() = (
        SELECT owner_id FROM public.pets WHERE id = pet_id
    ));

CREATE POLICY "Owner CRUD on skill_events" ON public.skill_events
    USING (auth.uid() = (
        SELECT owner_id FROM public.pets WHERE id = pet_id
    ));

/* --------------------------------------------------------------------
   OPTIONAL: helper function to create a default pet on signup
   ------------------------------------------------------------------*/
CREATE OR REPLACE FUNCTION public.create_default_pet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pets (owner_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_pet_after_profile ON public.profiles;
CREATE TRIGGER trg_create_pet_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.create_default_pet();

/* --------------------------------------------------------------------
   THAT'S IT – deploy and start building the client!
   ------------------------------------------------------------------*/ 