-- ============================================================
-- Multi-event architecture — Phase 1c: split stands into
-- physical slot / reservation / assignment
-- ============================================================
-- Depends on: phase1b_event_exhibitors.sql (composite FK target).
-- This is the riskiest single file in Phase 1 — review the backfilled row
-- counts carefully before treating this as done (see verification queries
-- at the bottom).
-- ============================================================

CREATE TYPE stand_reservation_status AS ENUM ('pending', 'confirmed', 'expired', 'cancelled');
CREATE TYPE stand_assignment_status  AS ENUM ('active', 'superseded', 'cancelled');

CREATE TABLE public.stand_reservations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stand_id       UUID NOT NULL REFERENCES public.stands(id) ON DELETE RESTRICT,
  exhibitor_id   UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  status         stand_reservation_status NOT NULL DEFAULT 'pending',
  quoted_price   NUMERIC(12,2) NOT NULL,
  requested_by   UUID REFERENCES public.profiles(id),
  expires_at     TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (event_id, exhibitor_id) REFERENCES public.event_exhibitors(event_id, exhibitor_id)
);
CREATE UNIQUE INDEX one_active_reservation_per_stand ON public.stand_reservations(event_id, stand_id)
  WHERE status IN ('pending', 'confirmed');

CREATE TABLE public.stand_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stand_id        UUID NOT NULL REFERENCES public.stands(id) ON DELETE RESTRICT,
  exhibitor_id    UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES public.stand_reservations(id) ON DELETE SET NULL,
  agreed_price    NUMERIC(12,2) NOT NULL,
  assigned_by     UUID REFERENCES public.profiles(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at   TIMESTAMPTZ,
  status          stand_assignment_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (event_id, exhibitor_id) REFERENCES public.event_exhibitors(event_id, exhibitor_id)
);
CREATE UNIQUE INDEX one_active_assignment_per_stand ON public.stand_assignments(event_id, stand_id)
  WHERE status = 'active';

CREATE TRIGGER set_stand_reservations_updated_at
  BEFORE UPDATE ON public.stand_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_stand_assignments_updated_at
  BEFORE UPDATE ON public.stand_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stand_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stand_reservations_select" ON public.stand_reservations FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);
CREATE POLICY "stand_reservations_write" ON public.stand_reservations FOR ALL USING (public.is_editor_or_above());

ALTER TABLE public.stand_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stand_assignments_select" ON public.stand_assignments FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR exhibitor_id IN (SELECT id FROM public.exhibitors WHERE auth_user_id = auth.uid())
);
CREATE POLICY "stand_assignments_write" ON public.stand_assignments FOR ALL USING (public.is_editor_or_above());

-- ------------------------------------------------------------
-- Backfill from the current flat stands.exhibitor_id/status
-- ------------------------------------------------------------
-- Current stand_status enum values (from seed.sql): available, reserved,
-- booked, unavailable. Mapping: booked -> stand_assignments (active);
-- reserved -> stand_reservations (pending); an exhibitor_id set alongside
-- 'unavailable' (e.g. taken offline for maintenance after being booked) is
-- preserved as a cancelled assignment rather than silently dropped.
--
-- Price: quoted_price/agreed_price are NOT NULL; stands.price is nullable
-- today, so rows with no price backfill as 0 and are flagged below for
-- manual review rather than blocking the migration.

INSERT INTO public.stand_assignments (event_id, stand_id, exhibitor_id, agreed_price, status)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  s.id,
  s.exhibitor_id,
  COALESCE(s.price, 0),
  'active'
FROM public.stands s
WHERE s.exhibitor_id IS NOT NULL AND s.status = 'booked';

INSERT INTO public.stand_assignments (event_id, stand_id, exhibitor_id, agreed_price, status, unassigned_at)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  s.id,
  s.exhibitor_id,
  COALESCE(s.price, 0),
  'cancelled',
  NOW()
FROM public.stands s
WHERE s.exhibitor_id IS NOT NULL AND s.status = 'unavailable';

INSERT INTO public.stand_reservations (event_id, stand_id, exhibitor_id, quoted_price, status)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  s.id,
  s.exhibitor_id,
  COALESCE(s.price, 0),
  'pending'
FROM public.stands s
WHERE s.exhibitor_id IS NOT NULL AND s.status = 'reserved';

-- >>> MANUAL REVIEW FLAG <<<
-- Rows backfilled with a $0 price because stands.price was NULL:
--   SELECT sa.id, sa.stand_id, s.stand_number FROM public.stand_assignments sa
--     JOIN public.stands s ON s.id = sa.stand_id WHERE sa.agreed_price = 0;
--   SELECT sr.id, sr.stand_id, s.stand_number FROM public.stand_reservations sr
--     JOIN public.stands s ON s.id = sr.stand_id WHERE sr.quoted_price = 0;

-- ------------------------------------------------------------
-- Trigger: keep event_exhibitors.stand_id in sync with the active
-- assignment (read-only denormalization; application code never writes it)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_event_exhibitor_stand()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'active' THEN
    UPDATE public.event_exhibitors
    SET stand_id = NEW.stand_id
    WHERE event_id = NEW.event_id AND exhibitor_id = NEW.exhibitor_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status <> 'active' THEN
    UPDATE public.event_exhibitors
    SET stand_id = NULL
    WHERE event_id = NEW.event_id AND exhibitor_id = NEW.exhibitor_id AND stand_id = NEW.stand_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_event_exhibitor_stand_trigger
  AFTER INSERT OR UPDATE ON public.stand_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_exhibitor_stand();

-- Run once now so the backfilled assignments above are reflected immediately
-- (the trigger only fires on rows inserted/updated after it's created).
UPDATE public.event_exhibitors ee
SET stand_id = sa.stand_id
FROM public.stand_assignments sa
WHERE sa.event_id = ee.event_id AND sa.exhibitor_id = ee.exhibitor_id AND sa.status = 'active';

-- ------------------------------------------------------------
-- v_stand_status — replaces the old flat stands.status column for the UI
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_stand_status AS
SELECT
  s.id AS stand_id,
  e.id AS event_id,
  CASE
    WHEN sa.id IS NOT NULL THEN 'booked'
    WHEN sr.id IS NOT NULL THEN 'reserved'
    ELSE 'available'
  END AS status,
  sa.exhibitor_id AS assigned_exhibitor_id,
  sr.exhibitor_id AS reserved_by_exhibitor_id
FROM public.stands s
CROSS JOIN public.events e
LEFT JOIN public.stand_assignments sa
  ON sa.stand_id = s.id AND sa.event_id = e.id AND sa.status = 'active'
LEFT JOIN public.stand_reservations sr
  ON sr.stand_id = s.id AND sr.event_id = e.id AND sr.status IN ('pending', 'confirmed');

-- ------------------------------------------------------------
-- Deprecate (don't drop yet — reversible insurance; zero automated test
-- coverage exists anywhere in this codebase today) the old flat columns.
-- ------------------------------------------------------------

ALTER TABLE public.stands RENAME COLUMN exhibitor_id TO _deprecated_exhibitor_id;
ALTER TABLE public.stands RENAME COLUMN status TO _deprecated_status;
ALTER TABLE public.stands RENAME COLUMN price TO list_price;

-- Verify before moving to phase1d:
--   SELECT count(*) FROM public.stands WHERE _deprecated_exhibitor_id IS NOT NULL AND _deprecated_status = 'booked';       -- A
--   SELECT count(*) FROM public.stand_assignments WHERE status = 'active';                                                 -- should equal A
--   SELECT count(*) FROM public.stands WHERE _deprecated_exhibitor_id IS NOT NULL AND _deprecated_status = 'reserved';     -- B
--   SELECT count(*) FROM public.stand_reservations WHERE status = 'pending';                                              -- should equal B
