-- Migration: Make URL optional in knowledge table
-- This allows for text-only knowledge entries without requiring a URL

-- 1. Drop the existing unique constraint on URL only
ALTER TABLE public.knowledge DROP CONSTRAINT IF EXISTS knowledge_url_key;

-- 2. Make URL column nullable (if it wasn't already)
ALTER TABLE public.knowledge ALTER COLUMN url DROP NOT NULL;

-- 3. Add new unique constraint on URL + content_hash combination
-- This allows multiple entries with NULL URLs while maintaining uniqueness for URL-based entries
ALTER TABLE public.knowledge ADD CONSTRAINT knowledge_url_content_hash_unique 
UNIQUE (url, content_hash);

-- 4. Add a check constraint to ensure either URL or content is provided
ALTER TABLE public.knowledge ADD CONSTRAINT knowledge_url_or_content_check 
CHECK (
    (url IS NOT NULL AND url != '') OR 
    (content IS NOT NULL AND content != '')
);

-- 5. Update comment for documentation
COMMENT ON COLUMN public.knowledge.url IS 'Optional URL source for the knowledge. Can be NULL for text-only knowledge entries.';
COMMENT ON CONSTRAINT knowledge_url_content_hash_unique ON public.knowledge IS 'Ensures uniqueness based on URL and content hash combination';
COMMENT ON CONSTRAINT knowledge_url_or_content_check ON public.knowledge IS 'Ensures each knowledge entry has either a URL or content'; 