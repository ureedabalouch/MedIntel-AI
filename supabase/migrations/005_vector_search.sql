-- MedIntel AI - Production Database Schema (Part 5: Vector Search & Document Chunking)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

-- Enable the pgvector extension to support high-performance vector operations
CREATE EXTENSION IF NOT EXISTS vector;

--------------------------------------------------------------------------------
-- 1. DOCUMENT CHUNKS (Granular text segments for vector search & retrieval)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    section_title VARCHAR(255),
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(1536),
    processing_version VARCHAR(50),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Enforce that each document can only have one chunk with the same chunk_index
    CONSTRAINT uq_document_chunk_index UNIQUE (document_id, chunk_index)
);

-- Comments on tables and columns for database documentation and observability
COMMENT ON TABLE public.document_chunks IS 'Stores segmented text portions of uploaded documents along with their corresponding vector embeddings for semantic search.';
COMMENT ON COLUMN public.document_chunks.id IS 'Unique identifier for the document chunk.';
COMMENT ON COLUMN public.document_chunks.document_id IS 'Foreign key referencing the parent document.';
COMMENT ON COLUMN public.document_chunks.organization_id IS 'Foreign key referencing the organization (for multi-tenant isolation).';
COMMENT ON COLUMN public.document_chunks.chunk_index IS 'The zero-indexed position of the chunk within the document sequence.';
COMMENT ON COLUMN public.document_chunks.page_number IS 'The page number where this chunk originates (for citation and UI referencing).';
COMMENT ON COLUMN public.document_chunks.section_title IS 'The section or chapter header where this chunk was extracted.';
COMMENT ON COLUMN public.document_chunks.content IS 'The raw text content of the chunk.';
COMMENT ON COLUMN public.document_chunks.token_count IS 'The number of tokens within the text chunk (useful for LLM window calculations).';
COMMENT ON COLUMN public.document_chunks.embedding IS 'The 1536-dimensional vector embedding of the content (compatible with standard models like OpenAI text-embedding-3-small or Gemini embeddings).';
COMMENT ON COLUMN public.document_chunks.processing_version IS 'Specifies the model version or embedding algorithm used to generate this chunk''s vector (e.g., gemini-embedding-001).';
COMMENT ON COLUMN public.document_chunks.metadata IS 'Flexible JSON container for storing ingestion telemetry, chunk sources, or custom pipeline attributes.';
COMMENT ON COLUMN public.document_chunks.created_at IS 'Timestamp of when the chunk was processed and stored.';
COMMENT ON COLUMN public.document_chunks.updated_at IS 'Timestamp of when the chunk was last modified or regenerated.';

--------------------------------------------------------------------------------
-- 2. INDEXES & PERFORMANCE OPTIMIZATIONS
--------------------------------------------------------------------------------
-- B-Tree indexes for relational traversal, multi-tenant isolation, and chunk sorting
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_organization_id ON public.document_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON public.document_chunks(chunk_index);

-- GIN index for rapid metadata searches and querying nested JSON parameters
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata_gin ON public.document_chunks USING gin (metadata);

-- Full Text Search GIN index on text content to support lexical lookup alongside semantic search
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_search
ON public.document_chunks
USING GIN (to_tsvector('english', content));

-- HNSW (Hierarchical Navigable Small World) index for high-performance approximate nearest neighbor (ANN) vector search.
-- It is optimized using cosine similarity (vector_cosine_ops).
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON public.document_chunks
USING hnsw (embedding vector_cosine_ops);

--------------------------------------------------------------------------------
-- 3. UPDATED_AT TIMESTAMP TRIGGER
--------------------------------------------------------------------------------
-- Apply trigger helper from 001_initial_schema.sql to automatically manage updated_at on change

DROP TRIGGER IF EXISTS trigger_document_chunks_updated_at ON public.document_chunks;
CREATE TRIGGER trigger_document_chunks_updated_at
BEFORE UPDATE ON public.document_chunks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 4. VECTOR SIMILARITY SEARCH FUNCTION (RPC)
--------------------------------------------------------------------------------
-- Performs cosine similarity search using <=> operator
CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_organization_id uuid DEFAULT NULL,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    organization_id uuid,
    chunk_index int,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.organization_id,
        dc.chunk_index,
        dc.content,
        dc.metadata,
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM public.document_chunks dc
    WHERE
        (filter_organization_id IS NULL OR dc.organization_id = filter_organization_id)
        AND (filter_document_id IS NULL OR dc.document_id = filter_document_id)
        AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_document_chunks(vector(1536), float, int, uuid, uuid) IS 'Performs pgvector cosine similarity search on document chunks under strict tenant isolation.';

--------------------------------------------------------------------------------
-- 5. FULL-TEXT SEARCH FUNCTION (RPC)
--------------------------------------------------------------------------------
-- Performs full-text search with ranking using ts_rank_cd and websearch_to_tsquery
CREATE OR REPLACE FUNCTION public.fts_document_chunks(
    query_text text,
    match_count int,
    filter_organization_id uuid DEFAULT NULL,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    organization_id uuid,
    chunk_index int,
    content text,
    metadata jsonb,
    rank float
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.organization_id,
        dc.chunk_index,
        dc.content,
        dc.metadata,
        ts_rank_cd(to_tsvector('english', dc.content), websearch_to_tsquery('english', query_text))::float AS rank
    FROM public.document_chunks dc
    WHERE
        (filter_organization_id IS NULL OR dc.organization_id = filter_organization_id)
        AND (filter_document_id IS NULL OR dc.document_id = filter_document_id)
        AND to_tsvector('english', dc.content) @@ websearch_to_tsquery('english', query_text)
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.fts_document_chunks(text, int, uuid, uuid) IS 'Performs PostgreSQL native full-text search on document chunks under strict tenant isolation.';


