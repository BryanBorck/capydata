-- Migration: Add pgVector embeddings support to knowledge table
-- Run this migration to add semantic search capabilities to existing databases

-- 1. Enable pgVector extension (requires superuser privileges)
-- Note: You may need to enable this through the Supabase dashboard or request it from support
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embeddings column to existing knowledge table
ALTER TABLE public.knowledge 
ADD COLUMN IF NOT EXISTS embeddings vector(1536);

-- 3. Create vector similarity search index
-- This improves performance for semantic search queries
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings 
ON public.knowledge 
USING ivfflat (embeddings vector_cosine_ops) 
WITH (lists = 100);

-- 4. Create a function for semantic search (optional, for easier querying)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  url text,
  content text,
  title text,
  content_hash text,
  metadata jsonb,
  created_at timestamptz,
  embeddings vector(1536),
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    id,
    url,
    content,
    title,
    content_hash,
    metadata,
    created_at,
    embeddings,
    1 - (embeddings <=> query_embedding) as similarity
  FROM knowledge
  WHERE embeddings IS NOT NULL
  AND 1 - (embeddings <=> query_embedding) >= match_threshold
  ORDER BY embeddings <=> query_embedding
  LIMIT match_count;
$$;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.knowledge.embeddings IS 'OpenAI Ada-002 embeddings (1536 dimensions) for semantic search';
COMMENT ON INDEX idx_knowledge_embeddings IS 'IVFFlat index for fast cosine similarity search on embeddings';
COMMENT ON FUNCTION match_knowledge IS 'Function to perform semantic search using cosine similarity on embeddings';

-- 6. Grant necessary permissions (adjust based on your setup)
-- GRANT EXECUTE ON FUNCTION match_knowledge TO authenticated;
-- GRANT EXECUTE ON FUNCTION match_knowledge TO anon; 