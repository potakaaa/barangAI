-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: update_vector_dim
-- The Gemini embedding model `gemini-embedding-001` outputs 3072 dimensions.
-- This migration updates the reports table and RPC to match the new dimensions.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Update the column type to vector(3072)
alter table reports alter column summary_embedding type vector(3072);

-- 2. Drop the old function because we are changing the input parameter type
drop function if exists match_similar_reports(vector(768), float, int, text, text);

-- 3. Recreate the function with vector(3072)
create or replace function match_similar_reports(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_concern_type text,
  filter_location_zone text
)
returns table (
  id uuid,
  incident_id uuid,
  summary text,
  similarity float
)
language sql stable
as $$
  select
    reports.id,
    reports.incident_id,
    reports.summary,
    1 - (reports.summary_embedding <=> query_embedding) as similarity
  from reports
  where 1 - (reports.summary_embedding <=> query_embedding) > match_threshold
    and reports.concern_type = filter_concern_type
    and (
      filter_location_zone is null 
      or lower(trim(reports.location_zone)) = lower(trim(filter_location_zone))
    )
  order by reports.summary_embedding <=> query_embedding
  limit match_count;
$$;
