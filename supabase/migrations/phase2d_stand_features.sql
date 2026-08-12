-- ============================================================
-- Multi-event architecture — Phase 2d: stand features catalog + self-service assignment
-- ============================================================
-- Depends on: phase1c_stand_reservations_assignments.sql (stand_reservations/
-- stand_assignments), phase2c_stand_self_service_reserve.sql (the SECURITY
-- DEFINER + SET search_path = '' style this migration's RPC follows), seed.sql
-- (public.set_updated_at(), public.is_editor_or_above()).
--
-- WHY THIS EXISTS:
--
-- stand_features / stand_feature_assignments have never had a committed SQL
-- definition anywhere in either repo -- zift_mobile's supabase_service.dart
-- (getStandFeatures/assignStandFeatures/getStandFeatureAssignments) and
-- zitf-admin's stand-feature.service.ts + app/(dashboard)/stands/features
-- page all query these tables already, but on a project where neither table
-- exists yet they simply fail (getStandFeatures already defends against this
-- with a try/catch returning [], which is why the exhibitor "Extra Features"
-- step of ApplyStandBottomSheet silently shows an empty list today instead of
-- crashing). This migration creates the real tables matching the exact shape
-- the client code already expects, so that step actually has features to
-- offer instead of always being empty.
--
-- SCHEMA NOTE: stand_feature_assignments is keyed by stand_id alone (matching
-- assignStandFeatures' `onConflict: 'stand_id,feature_id'` upsert), not by
-- stand_reservations.id/stand_assignments.id. That means a feature add-on
-- follows the physical stand across editions rather than being scoped to one
-- booking -- a known simplification (flagged back in the original multi-event
-- plan as "should repoint to reservation/assignment id" once a real schema
-- pull was possible). Left as-is here to match already-shipped client code
-- exactly rather than requiring a coordinated app change; revisit if a stand
-- ever needs genuinely different add-ons from one edition to the next.
-- ============================================================

-- ------------------------------------------------------------
-- 1. stand_features -- the catalog of purchasable add-ons
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stand_features (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Defensive column backfill: stand_features has already been observed to
-- pre-exist live with only a subset of these columns (missing the UNIQUE on
-- name; a separate run of this migration also hit "column updated_at of
-- relation stand_feature_assignments does not exist" on the sibling table
-- below, same root cause). ADD COLUMN IF NOT EXISTS is a true no-op for any
-- column that's already there, in whatever form -- it does not validate type/
-- nullability/default against an existing column, only the name. Safe
-- whether stand_features is brand new (just created above) or pre-existing.
ALTER TABLE public.stand_features ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.stand_features ADD COLUMN IF NOT EXISTS default_price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.stand_features ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.stand_features ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.stand_features ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Guards against stand_features already existing (e.g. created ad-hoc via the
-- dashboard table editor at some point, without this constraint) -- in that
-- case CREATE TABLE IF NOT EXISTS above silently no-ops and this UNIQUE would
-- otherwise never actually get applied, breaking the ON CONFLICT (name) seed
-- insert below with a 42P10 error. Uses Postgres's own default constraint
-- name for an inline single-column UNIQUE, so this is a true no-op when the
-- table really was just created fresh by the statement above.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stand_features_name_key') THEN
    ALTER TABLE public.stand_features ADD CONSTRAINT stand_features_name_key UNIQUE (name);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_stand_features_updated_at ON public.stand_features;
CREATE TRIGGER set_stand_features_updated_at
  BEFORE UPDATE ON public.stand_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 2. stand_feature_assignments -- which stand has which add-ons
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stand_feature_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id   UUID NOT NULL REFERENCES public.stands(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.stand_features(id) ON DELETE RESTRICT
);

-- Same defensive backfill as stand_features above -- this table has been
-- observed live without an updated_at column at all.
ALTER TABLE public.stand_feature_assignments ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10,2);
ALTER TABLE public.stand_feature_assignments ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.stand_feature_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.stand_feature_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Same guard as stand_features_name_key above, for the composite UNIQUE this
-- migration's assign_stand_feature() RPC relies on via
-- ON CONFLICT (stand_id, feature_id).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stand_feature_assignments_stand_id_feature_id_key'
  ) THEN
    ALTER TABLE public.stand_feature_assignments
      ADD CONSTRAINT stand_feature_assignments_stand_id_feature_id_key UNIQUE (stand_id, feature_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_stand_feature_assignments_updated_at ON public.stand_feature_assignments;
CREATE TRIGGER set_stand_feature_assignments_updated_at
  BEFORE UPDATE ON public.stand_feature_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_stand_feature_assignments_stand_id
  ON public.stand_feature_assignments(stand_id);

-- ------------------------------------------------------------
-- 3. RLS -- staff manage the catalog directly; everyone can read it
-- ------------------------------------------------------------

ALTER TABLE public.stand_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stand_feature_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stand_features_select ON public.stand_features;
CREATE POLICY stand_features_select ON public.stand_features
  FOR SELECT USING (true);

DROP POLICY IF EXISTS stand_features_write ON public.stand_features;
CREATE POLICY stand_features_write ON public.stand_features
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS stand_feature_assignments_select ON public.stand_feature_assignments;
CREATE POLICY stand_feature_assignments_select ON public.stand_feature_assignments
  FOR SELECT USING (true);

-- Staff can write directly (admin dashboard). Self-service exhibitor writes
-- go exclusively through assign_stand_feature() below, NOT this policy --
-- there is deliberately no self-service INSERT/UPDATE/DELETE policy here,
-- matching how stand_reservations_write (phase1c) stays staff-only while
-- reserve_stand() (phase2c) is the self-service side door.
DROP POLICY IF EXISTS stand_feature_assignments_write ON public.stand_feature_assignments;
CREATE POLICY stand_feature_assignments_write ON public.stand_feature_assignments
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

-- ------------------------------------------------------------
-- 4. Self-service assignment RPC -- the exhibitor-facing side door
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_stand_feature(
  p_stand_id     UUID,
  p_feature_id   UUID,
  p_custom_price NUMERIC,
  p_quantity     INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_exhibitor_id UUID;
  v_assignment_id       UUID;
BEGIN
  -- 1. Authorization: caller must be an exhibitor with a current claim
  -- (pending/confirmed reservation, or an active assignment) on this stand --
  -- i.e. they must have just reserved it via reserve_stand(), or already
  -- occupy it. This mirrors reserve_stand()'s own authorization shape.
  SELECT id INTO v_caller_exhibitor_id
  FROM public.exhibitors
  WHERE auth_user_id = auth.uid();

  IF v_caller_exhibitor_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized to modify features for this stand';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stand_reservations
    WHERE stand_id = p_stand_id AND exhibitor_id = v_caller_exhibitor_id
      AND status IN ('pending', 'confirmed')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.stand_assignments
    WHERE stand_id = p_stand_id AND exhibitor_id = v_caller_exhibitor_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify features for this stand';
  END IF;

  -- 2. The feature must exist and be active.
  IF NOT EXISTS (SELECT 1 FROM public.stand_features WHERE id = p_feature_id AND is_active) THEN
    RAISE EXCEPTION 'Feature not found or inactive';
  END IF;

  -- 3. Upsert -- matches the mobile client's own upsert semantics
  -- (onConflict: 'stand_id,feature_id'), just re-validated server-side.
  INSERT INTO public.stand_feature_assignments (stand_id, feature_id, custom_price, quantity)
  VALUES (p_stand_id, p_feature_id, p_custom_price, COALESCE(p_quantity, 1))
  ON CONFLICT (stand_id, feature_id)
  DO UPDATE SET custom_price = EXCLUDED.custom_price, quantity = EXCLUDED.quantity, updated_at = now()
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

-- ------------------------------------------------------------
-- 5. Seed a starter catalog so the exhibitor flow isn't empty on day one
-- ------------------------------------------------------------

INSERT INTO public.stand_features (name, description, default_price)
VALUES
  ('Extra Power Socket', 'Additional 220V power outlet at your stand', 25.00),
  ('Extra Table', 'One additional standard exhibition table', 15.00),
  ('Extra Chair', 'One additional chair', 5.00),
  ('Branding Panel', 'Printed branding panel on your stand fascia', 50.00),
  ('Storage Space', 'Lockable storage space behind your stand', 30.00)
ON CONFLICT (name) DO NOTHING;

-- Verification queries:
--
--   -- Confirm both tables and the seed landed:
--   SELECT * FROM public.stand_features ORDER BY name;
--
--   -- As an authenticated exhibitor who has just reserve_stand()'d p_stand_id,
--   -- this should succeed and return a new/updated assignment id:
--   SELECT public.assign_stand_feature('<stand_id>'::uuid, '<feature_id>'::uuid, 25.00, 1);
--
--   -- Calling it again with a different price for the same stand+feature
--   -- should update in place (same assignment id returned), not duplicate:
--   SELECT public.assign_stand_feature('<stand_id>'::uuid, '<feature_id>'::uuid, 30.00, 1);
--
--   -- As an exhibitor with NO reservation/assignment on that stand, this
--   -- should raise 'Not authorized to modify features for this stand':
--   SELECT public.assign_stand_feature('<some_other_stand_id>'::uuid, '<feature_id>'::uuid, 25.00, 1);
