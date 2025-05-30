-- Add data structures for pets (datainstances, knowledge, images)
-- This migration adds the backend data structures adapted for pets

/* --------------------------------------------------------------------
   DATAINSTANCES - content data linked to pets
   ------------------------------------------------------------------*/
CREATE TABLE IF NOT EXISTS public.datainstances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

/* --------------------------------------------------------------------
   KNOWLEDGE - URL content and knowledge base
   ------------------------------------------------------------------*/
CREATE TABLE IF NOT EXISTS public.knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    content TEXT NOT NULL,
    title TEXT,
    content_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(url)
);

/* --------------------------------------------------------------------
   IMAGES - image data with URLs
   ------------------------------------------------------------------*/
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    url_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(image_url)
);

/* --------------------------------------------------------------------
   JUNCTION TABLES - many-to-many relationships
   ------------------------------------------------------------------*/
-- Junction table for DataInstance ↔ Knowledge relationship
CREATE TABLE IF NOT EXISTS public.datainstance_knowledge (
    datainstance_id UUID NOT NULL REFERENCES public.datainstances(id) ON DELETE CASCADE,
    knowledge_id UUID NOT NULL REFERENCES public.knowledge(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (datainstance_id, knowledge_id)
);

-- Junction table for DataInstance ↔ Image relationship
CREATE TABLE IF NOT EXISTS public.datainstance_images (
    datainstance_id UUID NOT NULL REFERENCES public.datainstances(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (datainstance_id, image_id)
);

/* --------------------------------------------------------------------
   INDEXES for performance
   ------------------------------------------------------------------*/
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_datainstances_pet_id ON public.datainstances(pet_id);
CREATE INDEX IF NOT EXISTS idx_datainstance_knowledge_datainstance ON public.datainstance_knowledge(datainstance_id);
CREATE INDEX IF NOT EXISTS idx_datainstance_images_datainstance ON public.datainstance_images(datainstance_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_url ON public.knowledge(url);
CREATE INDEX IF NOT EXISTS idx_images_url ON public.images(image_url);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_datainstances_content_fts ON public.datainstances USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_knowledge_content_fts ON public.knowledge USING gin(to_tsvector('english', content));

/* --------------------------------------------------------------------
   SECURITY (Row-Level Security) - Disabled for simplicity
   ------------------------------------------------------------------*/
-- Disable RLS on new tables to match existing schema approach
ALTER TABLE public.datainstances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.datainstance_knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.datainstance_images DISABLE ROW LEVEL SECURITY; 