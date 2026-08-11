-- ============================================================
-- Multi-event architecture — Phase 2c: self-service stand reservation RPC
-- ============================================================
-- Depends on: phase1c_stand_reservations_assignments.sql (stand_reservations/
-- stand_assignments), phase1b_event_exhibitors.sql (event_exhibitors, the
-- composite FK target for stand_reservations), phase2a_rls_hardening_and_
-- junction_gaps.sql (public.is_editor_or_above()/is_admin_or_above(), and the
-- SECURITY DEFINER + SET search_path style this function follows).
--
-- WHY THIS EXISTS:
--
-- 1. Replaces a dead mobile-app call. zift_mobile/lib/services/
--    supabase_service.dart's bookStand() calls `_client.rpc('apply_for_stand',
--    ...)`, but no `apply_for_stand` function has ever existed in any
--    migration in this repo — every attempt to book a stand from the mobile
--    app fails outright. This migration gives the app a real RPC to call.
--    (Wiring the mobile client to call `reserve_stand` with the right params
--    instead of `apply_for_stand` is an application-layer follow-up in
--    zift_mobile, not part of this database migration.)
--
-- 2. Self-service counterpart to a staff-only write policy. `stand_
--    reservations_write` (phase1c) is `FOR ALL USING (public.is_editor_or_
--    above())` — by design, exhibitors have no RLS path to INSERT into
--    stand_reservations directly; only staff (editor role or above) can.
--    That is correct for staff-initiated reservations made in zitf-admin,
--    but it leaves self-service booking from the mobile app with no legal
--    way to create a row at all. This SECURITY DEFINER function is that way
--    in: it runs with the privileges of its owner (bypassing stand_
--    reservations_write) but enforces its own authorization check in step 1
--    below, so an exhibitor can only ever reserve a stand for themselves —
--    never for another exhibitor, and never anything staff-only like
--    confirming/cancelling a reservation or writing stand_assignments.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reserve_stand(
  p_event_id       UUID,
  p_stand_id       UUID,
  p_exhibitor_id   UUID,
  p_quoted_price   NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_exhibitor_id UUID;
  v_reservation_id      UUID;
BEGIN
  -- 1. Authorization: the caller must be an exhibitor, and must be reserving
  -- a stand for themselves specifically (not on behalf of some other
  -- exhibitor_id passed in by a malicious/buggy client).
  SELECT id INTO v_caller_exhibitor_id
  FROM public.exhibitors
  WHERE auth_user_id = auth.uid();

  IF v_caller_exhibitor_id IS NULL OR v_caller_exhibitor_id <> p_exhibitor_id THEN
    RAISE EXCEPTION 'Not authorized to reserve a stand for this exhibitor';
  END IF;

  -- 2. The stand must be free for this event: not already reserved
  -- (pending/confirmed) and not already assigned (active). This mirrors the
  -- partial unique indexes one_active_reservation_per_stand and
  -- one_active_assignment_per_stand from phase1c, checked up front so a
  -- self-service caller gets a clear application error instead of a raw
  -- unique-violation from the INSERT in step 4.
  IF EXISTS (
    SELECT 1 FROM public.stand_reservations
    WHERE event_id = p_event_id AND stand_id = p_stand_id AND status IN ('pending', 'confirmed')
  ) OR EXISTS (
    SELECT 1 FROM public.stand_assignments
    WHERE event_id = p_event_id AND stand_id = p_stand_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Stand already reserved or assigned';
  END IF;

  -- 3. stand_reservations has a composite FK (event_id, exhibitor_id) ->
  -- event_exhibitors(event_id, exhibitor_id) (phase1c). A self-service
  -- reservation may be an exhibitor's very first touch with this event, so
  -- this cannot assume staff have already created that row via
  -- event_exhibitors_insert (phase1b, editor-or-above-gated) — create it
  -- ourselves if missing, leaving it untouched if a staff-managed row
  -- already exists.
  INSERT INTO public.event_exhibitors (event_id, exhibitor_id)
  VALUES (p_event_id, p_exhibitor_id)
  ON CONFLICT (event_id, exhibitor_id) DO NOTHING;

  -- 4. Create the reservation itself, always as 'pending' — moving a
  -- reservation to 'confirmed', or converting it into a stand_assignments
  -- row, stays a staff action gated by stand_reservations_write /
  -- stand_assignments_write and is out of scope for this function.
  INSERT INTO public.stand_reservations (event_id, stand_id, exhibitor_id, status, quoted_price)
  VALUES (p_event_id, p_stand_id, p_exhibitor_id, 'pending', p_quoted_price)
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

-- Verification queries (run against a project where an `exhibitors` row
-- exists with auth_user_id = the id of an authenticated test user, and where
-- p_event_id/p_stand_id name a currently-unreserved, unassigned stand):
--
--   -- As that authenticated exhibitor test user, this should succeed and
--   -- return a new stand_reservations.id:
--   SELECT public.reserve_stand(
--     '<event_id>'::uuid, '<stand_id>'::uuid, '<own_exhibitor_id>'::uuid, 1500.00
--   );
--
--   -- Calling it again for the SAME event_id/stand_id should now raise
--   -- 'Stand already reserved or assigned' (caught by the step-2 check
--   -- before ever hitting the one_active_reservation_per_stand index):
--   SELECT public.reserve_stand(
--     '<event_id>'::uuid, '<stand_id>'::uuid, '<own_exhibitor_id>'::uuid, 1500.00
--   );
--
--   -- Passing someone else's exhibitor_id should raise
--   -- 'Not authorized to reserve a stand for this exhibitor':
--   SELECT public.reserve_stand(
--     '<event_id>'::uuid, '<stand_id>'::uuid, '<some_other_exhibitor_id>'::uuid, 1500.00
--   );
