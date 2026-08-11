-- ============================================================
-- Multi-event architecture — Phase 1a: halls become a reusable venue asset
-- ============================================================
-- Depends on: phase0_multievent_foundation.sql (creates `venues`/`events`,
-- and the synthetic backfill event 'b0000000-0000-0000-0000-000000000001').
--
-- A hall is a physical room reused edition after edition, so it belongs to
-- a `venue`, not directly to an `event`. Which halls are "in use" for a
-- given edition is tracked separately via `event_halls`.
-- ============================================================

-- ------------------------------------------------------------
-- 1. halls.venue_id
-- ------------------------------------------------------------

ALTER TABLE public.halls ADD COLUMN venue_id UUID REFERENCES public.venues(id);

UPDATE public.halls
SET venue_id = 'a0000000-0000-0000-0000-000000000001'
WHERE venue_id IS NULL;

-- Verify before proceeding: this should return 0.
--   SELECT count(*) FROM public.halls WHERE venue_id IS NULL;
ALTER TABLE public.halls ALTER COLUMN venue_id SET NOT NULL;

-- ------------------------------------------------------------
-- 2. event_halls — which halls are in service for a given edition
-- ------------------------------------------------------------

CREATE TABLE public.event_halls (
  event_id                UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  hall_id                 UUID NOT NULL REFERENCES public.halls(id)  ON DELETE RESTRICT,
  display_order_override  INT,
  capacity_override       INT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, hall_id)
);

ALTER TABLE public.event_halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_halls_select" ON public.event_halls FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_halls_insert" ON public.event_halls FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "event_halls_update" ON public.event_halls FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "event_halls_delete" ON public.event_halls FOR DELETE USING (public.is_admin_or_above());

-- Backfill: every existing hall is "in use" for the synthetic backfill event.
INSERT INTO public.event_halls (event_id, hall_id, is_active)
SELECT 'b0000000-0000-0000-0000-000000000001', h.id, h.is_active
FROM public.halls h
ON CONFLICT (event_id, hall_id) DO NOTHING;

-- Verify before moving to phase1b:
--   SELECT count(*) FROM public.halls;                                        -- N
--   SELECT count(*) FROM public.event_halls WHERE event_id = 'b0000000-0000-0000-0000-000000000001'; -- should also be N
