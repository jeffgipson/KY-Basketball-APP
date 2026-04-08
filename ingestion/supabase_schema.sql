-- =============================================================================
-- KHSBHOF Encyclopedia — Supabase pgvector Schema
-- Run this in the Supabase SQL editor before running the ingestion pipeline.
-- =============================================================================

-- Enable the pgvector extension (required)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- Table: encyclopedia_chunks
-- Stores text chunks extracted from the encyclopedia PDF along with their
-- vector embeddings and metadata for RAG retrieval.
-- =============================================================================
CREATE TABLE IF NOT EXISTS encyclopedia_chunks (
  id            BIGSERIAL PRIMARY KEY,
  content       TEXT        NOT NULL,
  -- 1024-dim embeddings from Voyage AI voyage-large-2 model
  embedding     VECTOR(1024),
  metadata      JSONB       NOT NULL DEFAULT '{}',
  -- Derived columns for fast filtering without parsing JSON
  page_start    INTEGER,
  page_end      INTEGER,
  section       TEXT,
  category      TEXT,
  year_start    INTEGER,
  year_end      INTEGER,
  -- Audit
  chunk_hash    TEXT        UNIQUE,  -- MD5 of content for dedup / upsert
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metadata JSONB structure (for reference):
-- {
--   "section":    "Sweet 16 Championships",     -- encyclopedia section name
--   "category":   "state_tournament",            -- normalized category key
--   "page_start": 142,                           -- PDF page where chunk starts
--   "page_end":   144,                           -- PDF page where chunk ends
--   "year_start": 1966,                          -- earliest year referenced
--   "year_end":   1972,                          -- latest year referenced
--   "columns":    [1, 2],                        -- which columns were extracted
--   "source_ref": "Sweet 16, p.142-144"          -- human-readable citation
-- }

-- =============================================================================
-- Index: IVFFlat for approximate nearest-neighbor (ANN) similarity search
-- For <10K chunks use HNSW; for larger datasets IVFFlat is more efficient.
-- Build AFTER loading data (empty table = poor index quality).
-- =============================================================================
CREATE INDEX IF NOT EXISTS encyclopedia_chunks_embedding_idx
  ON encyclopedia_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index on category for filtered search
CREATE INDEX IF NOT EXISTS encyclopedia_chunks_category_idx
  ON encyclopedia_chunks (category);

-- Index on section for filtered search
CREATE INDEX IF NOT EXISTS encyclopedia_chunks_section_idx
  ON encyclopedia_chunks (section);

-- Index on year range for temporal queries
CREATE INDEX IF NOT EXISTS encyclopedia_chunks_year_idx
  ON encyclopedia_chunks (year_start, year_end);

-- GIN index on metadata for arbitrary JSONB queries
CREATE INDEX IF NOT EXISTS encyclopedia_chunks_metadata_idx
  ON encyclopedia_chunks USING GIN (metadata);

-- =============================================================================
-- Function: match_chunks
-- Retrieves the top-K most semantically similar chunks for a given query
-- embedding. Supports optional metadata filtering.
-- =============================================================================
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding   VECTOR(1024),
  match_count       INT     DEFAULT 8,
  filter_category   TEXT    DEFAULT NULL,
  filter_year_start INT     DEFAULT NULL,
  filter_year_end   INT     DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id          BIGINT,
  content     TEXT,
  metadata    JSONB,
  section     TEXT,
  category    TEXT,
  page_start  INTEGER,
  page_end    INTEGER,
  year_start  INTEGER,
  year_end    INTEGER,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.content,
    ec.metadata,
    ec.section,
    ec.category,
    ec.page_start,
    ec.page_end,
    ec.year_start,
    ec.year_end,
    1 - (ec.embedding <=> query_embedding) AS similarity
  FROM encyclopedia_chunks ec
  WHERE
    -- Optional category filter
    (filter_category IS NULL OR ec.category = filter_category)
    -- Optional year range filter
    AND (filter_year_start IS NULL OR ec.year_end >= filter_year_start)
    AND (filter_year_end IS NULL OR ec.year_start <= filter_year_end)
    -- Similarity threshold to avoid garbage results
    AND 1 - (ec.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- Row Level Security
-- Allow anonymous (public) read access; writes require service role key.
-- =============================================================================
ALTER TABLE encyclopedia_chunks ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can query chunks (needed for the chat API)
CREATE POLICY "Allow public read on encyclopedia_chunks"
  ON encyclopedia_chunks
  FOR SELECT
  TO anon
  USING (true);

-- Service role can do everything (used by the ingestion pipeline)
CREATE POLICY "Allow service role full access on encyclopedia_chunks"
  ON encyclopedia_chunks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Helper: updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encyclopedia_chunks_updated_at
  BEFORE UPDATE ON encyclopedia_chunks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- Verification query — run after ingestion to check counts
-- =============================================================================
-- SELECT category, COUNT(*) FROM encyclopedia_chunks GROUP BY category ORDER BY COUNT(*) DESC;
