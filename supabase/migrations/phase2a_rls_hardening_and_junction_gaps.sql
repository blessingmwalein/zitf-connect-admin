-- ============================================================
-- Multi-event architecture — Phase 2a: RLS hardening + junction-table gaps
-- ============================================================
-- Two separate things landed together because they were found in the same
-- pass and are both small, additive/corrective RLS changes:
--
-- 1. BUG FIX in phase1b/phase1c/phase1d (not yet applied to the database —
--    safe to correct in place rather than layer a patch on top). Their
--    self-service SELECT policies on event_exhibitors, stand_reservations,
--    stand_assignments and event_visitors used `auth.uid() IS NOT NULL` as
--    a stand-in for "is staff". That was wrong: exhibitor and visitor
--    mobile-app accounts also authenticate through Supabase and get a real,
--    non-null auth.uid() (see exhibitors.auth_user_id / visitors.id ==
--    auth.uid()). The result as originally written: ANY authenticated
--    exhibitor or visitor — not just staff — could read every OTHER
--    exhibitor's application/payment status, every stand's reservation
--    price/notes, and every visitor's badge_id platform-wide, across every
--    event. Fixed below by gating the "see everything" branch on
--    public.is_editor_or_above() instead, matching the pattern already used
--    correctly in this same file's event_visitors_insert policy.
--
-- 2. GAP FILL: phase1e added event_id to leads/agenda_sessions/
--    event_attendance/engagement_logs but added no RLS at all. This adds
--    the self-service legs (SELECT and INSERT) for `leads` only (the one of
--    those four the original spec explicitly calls out as needing
--    per-exhibitor isolation — a lead is a visitor's contact info captured
--    by one exhibitor's booth staff, and must not be visible to other
--    exhibitors). This migration also explicitly enables RLS on `leads`
--    itself (see item 5) rather than assuming/hoping it already is — that
--    table's RLS state was never committed to any migration in this repo
--    (created directly against the live Supabase project), so leaving it
--    implicit would make this whole gap-fill a no-op if it turned out to be
--    off. Note: the INSERT policy gives legitimate rows a way to exist for
--    the SELECT policy to expose, but the mobile app's actual lead-capture
--    write path is independently broken today (missing `event_id`, and a
--    `capture_lead` RPC that doesn't exist) — that is an application-layer
--    bug tracked separately and is NOT fixed by this migration.
--    agenda_sessions/event_attendance/engagement_logs are intentionally left
--    untouched here: agenda_sessions is public schedule content with no
--    sensitivity, and event_attendance/engagement_logs are analytics rollups
--    with no established self-service read requirement in the spec — adding
--    speculative policies for those would be scope creep, not a fix.
--
-- 3. CRITICAL FIX: profiles_update_own (seed.sql) is `FOR UPDATE
--    USING (auth.uid() = id)` with no WITH CHECK, which means it silently
--    lets any authenticated user — including self-service exhibitor/visitor
--    accounts, not just staff — set their OWN `role` to 'super_admin' and
--    `is_active` to TRUE, fully defeating every is_editor_or_above()/
--    is_admin_or_above()-gated policy in the schema, including items 1-2
--    above. Fixed below (item 7) with a trigger, since RLS's WITH CHECK
--    alone can't compare a column's new value against its own pre-update
--    value.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix: event_exhibitors_select
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "event_exhibitors_select" ON public.event_exhibitors;
CREATE POLICY "event_exhibitors_select" ON public.event_exhibitors FOR SELECT USING (
  public.is_editor_or_above()
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 2. Fix: stand_reservations_select
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "stand_reservations_select" ON public.stand_reservations;
CREATE POLICY "stand_reservations_select" ON public.stand_reservations FOR SELECT USING (
  public.is_editor_or_above()
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 3. Fix: stand_assignments_select
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "stand_assignments_select" ON public.stand_assignments;
CREATE POLICY "stand_assignments_select" ON public.stand_assignments FOR SELECT USING (
  public.is_editor_or_above()
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 4. Fix: event_visitors_select
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "event_visitors_select" ON public.event_visitors;
CREATE POLICY "event_visitors_select" ON public.event_visitors FOR SELECT USING (
  public.is_editor_or_above() OR visitor_id = auth.uid()
);

-- ------------------------------------------------------------
-- 5. Gap fill: leads self-service SELECT, and make sure RLS is actually ON
-- ------------------------------------------------------------
-- Idempotent and safe whether or not RLS is already enabled on this table —
-- unlike the CREATE POLICY below, this is not a no-op if RLS was off, so the
-- gap-fill is now self-contained instead of resting on an unverified
-- assumption about `leads`' current state.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_exhibitor_self_service_select" ON public.leads FOR SELECT USING (
  exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 6. Gap fill: leads self-service INSERT (companion to item 5 — without
-- this, an exhibitor could never create the very rows the SELECT policy
-- above is meant to let them read back)
-- ------------------------------------------------------------
-- Scoped identically to the SELECT policy: an exhibitor may only insert a
-- lead against their own exhibitor_id, not anyone else's. This does not by
-- itself repair the mobile app's lead-capture write path (missing
-- event_id / dead capture_lead RPC — application-layer, tracked separately);
-- it makes the self-service capability actually reachable once that is
-- fixed, rather than leaving a read-only policy with no legitimate way for
-- a row to ever exist under it.
CREATE POLICY "leads_exhibitor_self_service_insert" ON public.leads FOR INSERT WITH CHECK (
  exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 7. CRITICAL fix: close the privilege-escalation hole in profiles_update_own
-- ------------------------------------------------------------
-- profiles_update_own (seed.sql) is `FOR UPDATE USING (auth.uid() = id)`
-- with no WITH CHECK. Per Postgres RLS semantics, an UPDATE policy that
-- omits WITH CHECK reuses USING as the check on the post-update row — and
-- since `id` isn't being changed, `auth.uid() = id` still holds no matter
-- what other columns change. Nothing restricts `role` or `is_active`, so
-- today ANY authenticated exhibitor/visitor can run
-- `UPDATE profiles SET role = 'super_admin' WHERE id = auth.uid();` and
-- immediately pass every is_editor_or_above()/is_admin_or_above()-gated
-- policy in the schema, including every fix in this file. This can't be
-- expressed as a WITH CHECK alone: a subquery against the same table inside
-- WITH CHECK sees the row's post-update state within the same command, not
-- its pre-update value, so there is no way for RLS by itself to compare
-- NEW.role against OLD.role. Hence a trigger.
CREATE OR REPLACE FUNCTION public.prevent_profile_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active)
     AND NOT public.is_admin_or_above() THEN
    RAISE EXCEPTION 'Only an admin may change role or is_active on a profile';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_self_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_self_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_self_escalation();

-- ------------------------------------------------------------
-- 8. Helper for the companion backend migration
-- (phase2b_billing_rls_active_event_scope.sql), which scopes the `anon`
-- role's blanket billing-table access down to a single event.
-- ------------------------------------------------------------
-- The synthetic backfill event from phase0 was seeded with status
-- 'published', not 'active' — 'active' is meant for "the show is literally
-- running this week", which nothing will be true of until this migration
-- set has actually shipped and someone flips it manually. Matching only
-- 'active' here would return zero rows today and silently break all guest
-- ticket browsing/checkout. 'published' and 'active' both mean "open for
-- ticket sales" in the event_lifecycle_status enum, so both qualify.
--
-- ORDER BY start_date ASC picks the soonest such event if more than one is
-- ever published/active simultaneously (e.g. next year's edition opened for
-- early sales while this year's is still running) — a deliberate, documented
-- simplification, consistent with the DEFAULT_EVENT_ID bridging-constant
-- approach used elsewhere in this refactor until a real event-selection UX
-- exists. Revisit once concurrent multi-event sales are an actual scenario.
--
-- `, id ASC` is a deliberate tie-breaker: two events sharing the same
-- start_date otherwise have no guaranteed-stable ordering, which would let a
-- multi-statement flow (e.g. anon INSERT orders then INSERT order_items,
-- each independently re-evaluating this function) resolve to a DIFFERENT
-- event between calls and fail a legitimate write closed. `id` never ties.
CREATE OR REPLACE FUNCTION public.get_active_event_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.events
  WHERE status IN ('published', 'active')
  ORDER BY start_date ASC, id ASC
  LIMIT 1;
$$;

-- Verification queries:
--   SELECT public.get_active_event_id(); -- should return b0000000-0000-0000-0000-000000000001 today
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'leads'; -- must now be true (item 5 sets it)
--   -- Privilege-escalation guard (item 7) — run as a non-admin test user, should raise:
--   --   UPDATE public.profiles SET role = 'super_admin' WHERE id = auth.uid();
--   -- and this should still succeed for that same user (unrelated columns untouched):
--   --   UPDATE public.profiles SET full_name = full_name WHERE id = auth.uid();
