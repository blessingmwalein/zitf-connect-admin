-- ============================================================
-- Multi-event architecture — Phase 1e: leads + agenda/attendance/engagement
-- ============================================================
-- Depends on: phase1b_event_exhibitors.sql, phase1d_event_visitors.sql
-- (composite FK targets).
-- ============================================================

-- ------------------------------------------------------------
-- leads: needs a real event_id + composite FKs so a lead can't reference an
-- exhibitor/visitor not actually registered for that event.
-- ------------------------------------------------------------

ALTER TABLE public.leads ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

UPDATE public.leads
SET event_id = 'b0000000-0000-0000-0000-000000000001'
WHERE event_id IS NULL;

-- Verify before proceeding: this should return 0.
--   SELECT count(*) FROM public.leads WHERE event_id IS NULL;
ALTER TABLE public.leads ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_event_exhibitor_fkey
    FOREIGN KEY (event_id, exhibitor_id) REFERENCES public.event_exhibitors(event_id, exhibitor_id),
  ADD CONSTRAINT leads_event_visitor_fkey
    FOREIGN KEY (event_id, visitor_id) REFERENCES public.event_visitors(event_id, visitor_id);

-- ------------------------------------------------------------
-- agenda_sessions: a session belongs to exactly one edition.
-- ------------------------------------------------------------

ALTER TABLE public.agenda_sessions ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

UPDATE public.agenda_sessions
SET event_id = 'b0000000-0000-0000-0000-000000000001'
WHERE event_id IS NULL;

-- Verify: SELECT count(*) FROM public.agenda_sessions WHERE event_id IS NULL; -- should be 0
ALTER TABLE public.agenda_sessions ALTER COLUMN event_id SET NOT NULL;

-- ------------------------------------------------------------
-- event_attendance: composite-FK to event_visitors so a check-in can't
-- reference a visitor not registered for that event.
-- ------------------------------------------------------------

ALTER TABLE public.event_attendance ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

UPDATE public.event_attendance
SET event_id = 'b0000000-0000-0000-0000-000000000001'
WHERE event_id IS NULL;

ALTER TABLE public.event_attendance ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE public.event_attendance
  ADD CONSTRAINT event_attendance_event_visitor_fkey
    FOREIGN KEY (event_id, visitor_id) REFERENCES public.event_visitors(event_id, visitor_id);

-- ------------------------------------------------------------
-- engagement_logs: event_id stays nullable (matches the existing nullable
-- session_id column — this is an analytics/logging table, not a source of
-- truth for participation), but gets the same composite-FK protection for
-- any row where both event_id and visitor_id are populated.
-- ------------------------------------------------------------

ALTER TABLE public.engagement_logs ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

UPDATE public.engagement_logs
SET event_id = 'b0000000-0000-0000-0000-000000000001'
WHERE event_id IS NULL;

ALTER TABLE public.engagement_logs
  ADD CONSTRAINT engagement_logs_event_visitor_fkey
    FOREIGN KEY (event_id, visitor_id) REFERENCES public.event_visitors(event_id, visitor_id);

-- Verify before moving to phase1f:
--   SELECT count(*) FROM public.leads WHERE event_id IS NULL;              -- 0
--   SELECT count(*) FROM public.agenda_sessions WHERE event_id IS NULL;    -- 0
--   SELECT count(*) FROM public.event_attendance WHERE event_id IS NULL;   -- 0
