-- ============================================================
-- Multi-event architecture — Phase 0
-- ============================================================
-- This migration:
--   1. Renames the existing "events" table (which is actually a conference
--      agenda/session model — see seed data: "Opening Ceremony", "Digital
--      Transformation Summit", etc.) to "agenda_sessions", freeing the
--      "events" name for the real top-level tenant entity.
--   2. Creates "venues" and the new "events" (fair/tenant) table.
--   3. Backfills one synthetic event row so every table added in later
--      phases has something real to reference during backfill.
--   4. Creates a DB-backed "exhibitor_categories" table seeded from the
--      admin app's hardcoded ZITF_CATEGORIES constant.
--
-- IMPORTANT — this file must be applied in the SAME deployment window as
-- the app-code changes that repoint `.from('events')` -> `.from('agenda_sessions')`
-- in zitf-admin and zift_mobile (see docs/plan). Applying this migration
-- alone, without those code changes shipping at the same time, will break
-- every "sessions"/"schedule" feature in both apps until they're repointed.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Rename the collision: events (sessions) -> agenda_sessions
-- ------------------------------------------------------------

ALTER TABLE public.events RENAME TO agenda_sessions;
ALTER TYPE public.event_status RENAME TO agenda_session_status;

ALTER TABLE public.event_attendance RENAME COLUMN event_id TO session_id;
ALTER TABLE public.event_attendance
  DROP CONSTRAINT IF EXISTS event_attendance_event_id_fkey,
  ADD CONSTRAINT event_attendance_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.agenda_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.engagement_logs RENAME COLUMN event_id TO session_id;
ALTER TABLE public.engagement_logs
  DROP CONSTRAINT IF EXISTS engagement_logs_event_id_fkey,
  ADD CONSTRAINT engagement_logs_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.agenda_sessions(id) ON DELETE SET NULL;

-- Output column names (event_id/event_name) are deliberately kept as-is even
-- though the source is now `agenda_sessions` — zitf-admin/app/(dashboard)/
-- analytics/page.tsx reads `d.event_name` directly off this view's rows, and
-- renaming the view's own name already requires updating its one caller
-- (analytics.service.ts); there's no need to also break the output shape.
DROP VIEW IF EXISTS public.v_event_participation;
CREATE OR REPLACE VIEW public.v_agenda_session_participation AS
SELECT
  ev.id AS event_id,
  ev.name AS event_name,
  ev.start_time,
  h.name AS hall_name,
  COUNT(ea.id) AS attendee_count,
  ev.capacity,
  CASE WHEN ev.capacity > 0
    THEN ROUND((COUNT(ea.id)::NUMERIC / ev.capacity) * 100, 1)
    ELSE NULL
  END AS fill_rate_pct
FROM public.agenda_sessions ev
LEFT JOIN public.halls h ON h.id = ev.hall_id
LEFT JOIN public.event_attendance ea ON ea.session_id = ev.id
GROUP BY ev.id, ev.name, ev.start_time, h.name, ev.capacity;

-- ------------------------------------------------------------
-- 2. Venues — reusable physical location, independent of any one edition
-- ------------------------------------------------------------

CREATE TABLE public.venues (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  country     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  timezone    TEXT NOT NULL DEFAULT 'Africa/Harare',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_select" ON public.venues FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "venues_insert" ON public.venues FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "venues_update" ON public.venues FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "venues_delete" ON public.venues FOR DELETE USING (public.is_admin_or_above());

-- Coordinates/name match the constant already hardcoded across the admin's
-- map components (components/maps/map-container-inner.tsx ZITF_CENTER) and
-- the backend's tracking simulation (tracking.controller.ts ZITF_CENTER) —
-- reusing them here means zero visual change to any existing map until this
-- row is deliberately edited.
INSERT INTO public.venues (id, name, address, city, country, latitude, longitude)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Agric Show Exhibition Grounds',
  'Exhibition Grounds',
  'Bulawayo',
  'Zimbabwe',
  -20.1575,
  28.5833
);

-- ------------------------------------------------------------
-- 3. Events — the real top-level tenant entity (a fair/expo edition)
-- ------------------------------------------------------------

CREATE TYPE event_lifecycle_status AS ENUM ('draft', 'published', 'active', 'completed', 'cancelled', 'archived');

CREATE TABLE public.events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  venue_id          UUID REFERENCES public.venues(id),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  status            event_lifecycle_status NOT NULL DEFAULT 'draft',
  country           TEXT,
  city              TEXT,
  address           TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  cover_image_url   TEXT,
  logo_url          TEXT,
  order_prefix      TEXT NOT NULL DEFAULT 'EVT',
  timezone          TEXT NOT NULL DEFAULT 'Africa/Harare',
  created_by        UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (public.is_admin_or_above());

-- Synthetic backfill event — every table that gains an `event_id` column in
-- later migration phases gets backfilled to point at this row, so existing
-- production data (halls, exhibitors, stands, tickets, orders, ...) has a
-- real event to belong to once those columns go NOT NULL.
--
-- Dates below are what was confirmed for this specific edition (Aug 20-30,
-- 2026) — update this row directly if they change; nothing else depends on
-- these values being exactly right, only on the row existing.
INSERT INTO public.events (
  id, name, slug, description, venue_id, start_date, end_date, status,
  country, city, address, latitude, longitude, order_prefix
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Zimbabwe Agricultural Show 2026',
  'zimbabwe-agricultural-show-2026',
  'Zimbabwe Agricultural Show',
  'a0000000-0000-0000-0000-000000000001',
  '2026-08-20',
  '2026-08-30',
  'published',
  'Zimbabwe',
  'Bulawayo',
  'Agric Show Exhibition Grounds',
  -20.1575,
  28.5833,
  'ZAS'
);

-- ------------------------------------------------------------
-- 4. Exhibitor categories — DB-backed instead of a hardcoded frontend array
-- ------------------------------------------------------------

CREATE TABLE public.exhibitor_categories (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_exhibitor_categories_updated_at
  BEFORE UPDATE ON public.exhibitor_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.exhibitor_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exhibitor_categories_select" ON public.exhibitor_categories FOR SELECT USING (true);
CREATE POLICY "exhibitor_categories_insert" ON public.exhibitor_categories FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "exhibitor_categories_update" ON public.exhibitor_categories FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "exhibitor_categories_delete" ON public.exhibitor_categories FOR DELETE USING (public.is_admin_or_above());

-- Seeded verbatim from zitf-admin/lib/constants/categories.ts's ZITF_CATEGORIES
-- (also mirrored byte-for-byte in zift_mobile/lib/config/constants.dart's
-- zitfCategories map) so no data changes for existing exhibitor.category_id
-- values once the FK constraint is added in a later phase.
INSERT INTO public.exhibitor_categories (id, name) VALUES
  (183, 'Banking, Insurance & Financial Services'),
  (184, 'ASAMBENI (Business Tourism)'),
  (185, 'PAKPRINT (Printing, Publishing & Stationery, Packaging, Labelling, Bottling)'),
  (186, 'SCHOLASTICA (Education, Training, Consultancy)'),
  (187, 'ULTIM8 HOME (Building, Construction, Hardware, Interior Decorating)'),
  (188, 'Advertising, Graphic Arts, Industrial Design'),
  (189, 'Agricultural Produce, Arboriculture, Horticulture, Fisheries'),
  (190, 'Agricultural & Irrigation Equipment, Water Engineering'),
  (191, 'Arts & Crafts'),
  (192, 'Automation'),
  (193, 'Automotive, Garage Equipment'),
  (194, 'Business Services: Management, Clearing & Forwarding, Courier, Consultancy, Insurance'),
  (195, 'Chemicals, Pharmaceuticals'),
  (196, 'Children''s Goods'),
  (197, 'Civic Representation (Local Government)'),
  (198, 'Clothing, Textiles, Haberdashery, Upholstery, Production Machinery & Equipment'),
  (199, 'ICT, Office Equipment, Audio-Visual, Hi-Tech, Telecommunications'),
  (200, 'Consumer Goods, Gift Items, Jewellery, Accessories'),
  (201, 'Cosmetics, Toiletries, Hairdressing'),
  (202, 'Distributors and Wholesalers'),
  (203, 'Ecology, Conservation and Greening: Waste Management, Rehabilitation, Recycling'),
  (204, 'Electrical Engineering, Household Equipment'),
  (205, 'Electronics'),
  (206, 'Energy (Electric, Hydro, Solar, Thermal, Wind)'),
  (207, 'Event Management: Exhibitions, Conferences, Congresses, Meetings'),
  (208, 'Food, Food Processing, Beverages, Catering and Equipment'),
  (209, 'Footwear, Leather Goods'),
  (210, 'Furniture, Wood Products'),
  (211, 'Glassware, Porcelain, Crockery'),
  (212, 'Health: Services, Non-Pharmaceutical Products, Medical Aid Societies'),
  (213, 'Hydraulics and Lifting Equipment'),
  (214, 'Industrial Chemicals, Cleaning Materials & Equipment'),
  (215, 'Instrumentation'),
  (216, 'Light and Heavy Engineering, Tools'),
  (217, 'Media'),
  (218, 'Mining, Mineral Processing, Geology'),
  (219, 'Pharmaceuticals, Medical, Laboratory & Scientific Products, Instruments/Equipment'),
  (220, 'Plastics, Rubber'),
  (221, 'Pneumatic Equipment'),
  (222, 'Public Services (Govt): Administration, Culture, Health, Conservation, Education & Training'),
  (223, 'Refrigeration, Air-conditioning, Heating'),
  (224, 'Religious, Social Organisations, Services'),
  (225, 'Security: Manpower, Systems, Products'),
  (226, 'Transport: Aviation, Boating, Bicycles, Motorcycles, Rail, Vehicles'),
  (395, 'Legal (Corporate Law, Intellectual Property Law, Criminal Law)'),
  (396, 'Government Agencies'),
  (397, 'Sports and Culture'),
  (398, 'Manufacturing'),
  (399, 'Marketing');
