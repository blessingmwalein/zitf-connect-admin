-- ============================================================
-- Multi-event architecture — Phase 1d: visitor event participation
-- ============================================================
-- Depends on: phase0_multievent_foundation.sql.
--
-- Resolves the "does visitors have an auth-linkage column?" open item from
-- the plan: it doesn't need a new column. The mobile app's visitor signup
-- flow (`SignupScreen._createVisitorProfile` in zift_mobile) inserts with
-- `'id': user.id` — i.e. `visitors.id` already equals the Supabase auth
-- user's UID directly for any visitor created through the app (unlike
-- exhibitors, which use a separate `auth_user_id` column decoupled from
-- `exhibitors.id`). Self-service RLS below uses `visitor_id = auth.uid()`
-- directly rather than adding a redundant column.
-- ============================================================

CREATE TABLE public.event_visitors (
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  visitor_id      UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  badge_id        TEXT,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ticket_id       UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, visitor_id),
  UNIQUE (event_id, badge_id)
);

CREATE TRIGGER set_event_visitors_updated_at
  BEFORE UPDATE ON public.event_visitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_visitors_select" ON public.event_visitors FOR SELECT USING (
  auth.uid() IS NOT NULL OR visitor_id = auth.uid()
);
CREATE POLICY "event_visitors_insert" ON public.event_visitors FOR INSERT WITH CHECK (
  public.is_editor_or_above() OR visitor_id = auth.uid()
);
CREATE POLICY "event_visitors_update" ON public.event_visitors FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "event_visitors_delete" ON public.event_visitors FOR DELETE USING (public.is_admin_or_above());

-- Backfill: every existing visitor's badge_id/registered_at move to the
-- junction row for the synthetic backfill event.
INSERT INTO public.event_visitors (event_id, visitor_id, badge_id, registered_at)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  v.id,
  v.badge_id,
  v.registered_at
FROM public.visitors v
ON CONFLICT (event_id, visitor_id) DO NOTHING;

-- Verify:
--   SELECT count(*) FROM public.visitors;                                                  -- N
--   SELECT count(*) FROM public.event_visitors WHERE event_id = 'b0000000-0000-0000-0000-000000000001'; -- should also be N
--   SELECT count(*) FROM public.visitors v WHERE v.badge_id IS NOT NULL
--     AND NOT EXISTS (SELECT 1 FROM public.event_visitors ev WHERE ev.visitor_id = v.id AND ev.badge_id = v.badge_id); -- should be 0

-- Deprecate rather than drop, for the same reason as stands/exhibitors in
-- phase1b/phase1c: several mobile-app code paths (QR badge generation,
-- `SupabaseService`) still read `visitors.badge_id` directly today and
-- haven't been migrated to `event_visitors` yet as of this file landing.
-- Dropping immediately would break those before they're updated. Actually
-- drop these once every consumer is confirmed reading from `event_visitors`
-- instead (Phase 2 cleanup, alongside the other `_deprecated_*` columns).
ALTER TABLE public.visitors RENAME COLUMN badge_id TO _deprecated_badge_id;
ALTER TABLE public.visitors RENAME COLUMN registered_at TO _deprecated_registered_at;
