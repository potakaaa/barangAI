-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: pending_clarifications
-- Tracks follow-up questions sent to citizens when the LLM detects that
-- critical information (e.g. location for a flooding report) is missing.
--
-- The report is already created with null fields — this table tracks
-- that we're waiting for the citizen to respond so we can update it.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists pending_clarifications (
  id               uuid         primary key default gen_random_uuid(),
  report_id        uuid         not null references reports(id) on delete cascade,
  ticket_number    text         not null,
  sender_ref       text         not null,
  channel          text         not null check (channel in ('telegram', 'sms')),
  missing_fields   jsonb        not null,   -- [{ "field": "location_raw", "question": "..." }]
  original_text    text         not null,   -- the citizen's original message (for LLM context)
  report_summary   text         not null,   -- LLM summary (for LLM context on resolution)
  concern_type     text         not null,
  original_language text        not null,
  status           text         not null default 'pending'
                     check (status in ('pending', 'resolved', 'expired')),
  created_at       timestamptz  not null default now(),
  resolved_at      timestamptz
);

-- Fast lookup: "does this sender have an active clarification?"
create index idx_pending_clarifications_sender
  on pending_clarifications (sender_ref, status)
  where status = 'pending';

-- Cleanup queries by age
create index idx_pending_clarifications_created
  on pending_clarifications (created_at)
  where status = 'pending';
