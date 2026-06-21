-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: clustering_fixes
-- Makes the location_zone filter case-insensitive for similarity matching.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function match_similar_reports(
  query_embedding vector(768),
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
