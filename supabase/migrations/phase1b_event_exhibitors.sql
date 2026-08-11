-- ============================================================
-- Multi-event architecture — Phase 1b: exhibitor event participation
-- ============================================================
-- Depends on: phase0_multievent_foundation.sql, phase1a_halls_venues.sql.
-- Must run BEFORE phase1c (stand_reservations/stand_assignments have a
-- composite FK to event_exhibitors).
--
-- `exhibitors` keeps company-identity fields only. Per-edition facts
-- (application/payment status, booth size requested, notes, approval
-- audit trail) move here. `hall_id` on exhibitors is dropped outright —
-- confirmed dead in the admin codebase (only ever reached via a join
-- through stands/halls, never read as a direct column).
-- ============================================================

CREATE TYPE exhibitor_application_status AS ENUM (
  'invited', 'applied', 'under_review', 'approved', 'rejected', 'withdrawn'
);
CREATE TYPE exhibitor_payment_status AS ENUM (
  'unpaid', 'partial', 'paid', 'waived', 'refunded'
);

CREATE TABLE public.event_exhibitors (
  event_id              UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  exhibitor_id          UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  application_status    exhibitor_application_status NOT NULL DEFAULT 'invited',
  payment_status        exhibitor_payment_status NOT NULL DEFAULT 'unpaid',
  stand_id              UUID REFERENCES public.stands(id) ON DELETE SET NULL, -- trigger-maintained, see phase1c
  booth_size_requested  TEXT,
  notes                 TEXT,
  applied_at            TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  approved_by           UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, exhibitor_id)
);

CREATE TRIGGER set_event_exhibitors_updated_at
  BEFORE UPDATE ON public.event_exhibitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_exhibitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_exhibitors_select" ON public.event_exhibitors FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);
CREATE POLICY "event_exhibitors_insert" ON public.event_exhibitors FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "event_exhibitors_update" ON public.event_exhibitors FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "event_exhibitors_delete" ON public.event_exhibitors FOR DELETE USING (public.is_admin_or_above());

-- Backfill every existing exhibitor into the synthetic backfill event,
-- mapping the old flat `exhibitors.status` into the new two-axis model.
-- `payment_status` cannot be derived — nothing in the current schema tracks
-- whether an exhibitor has paid their stand fee independently of the stand
-- itself being marked 'booked' — so everyone backfills as 'unpaid'.
-- >>> FLAG FOR MANUAL ADMIN RECONCILIATION AFTER THIS MIGRATION RUNS <<<
-- Cross-check against `payments` (payment_type='stand_application', status='paid')
-- and update payment_status to 'paid' for exhibitors with a matching successful
-- payment once phase1f has run and payments.metadata->>'exhibitor_id' is queryable.
INSERT INTO public.event_exhibitors (
  event_id, exhibitor_id, application_status, payment_status, booth_size_requested, notes
)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  e.id,
  CASE e.status
    WHEN 'approved' THEN 'approved'
    WHEN 'active'   THEN 'approved'
    WHEN 'pending'  THEN 'applied'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'inactive' THEN 'withdrawn'
    ELSE 'applied'
  END::exhibitor_application_status,
  'unpaid',
  e.booth_size,
  e.notes
FROM public.exhibitors e
ON CONFLICT (event_id, exhibitor_id) DO NOTHING;

-- Verify before moving to phase1c:
--   SELECT count(*) FROM public.exhibitors;                                               -- N
--   SELECT count(*) FROM public.event_exhibitors WHERE event_id = 'b0000000-0000-0000-0000-000000000001'; -- should also be N
--   SELECT application_status, count(*) FROM public.event_exhibitors GROUP BY 1;           -- sanity-check the status mapping
