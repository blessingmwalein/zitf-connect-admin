-- ============================================================
-- ZITF Connect Admin Portal - Database Schema & Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom enums
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
CREATE TYPE stand_status AS ENUM ('available', 'reserved', 'booked', 'unavailable');
CREATE TYPE lead_source AS ENUM ('qr_scan', 'nfc_tap', 'manual', 'app_checkin');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE exhibitor_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'inactive');

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  role          admin_role NOT NULL DEFAULT 'viewer',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_sign_in  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Halls
CREATE TABLE public.halls (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  map_url         TEXT,
  map_type        TEXT CHECK (map_type IN ('svg', 'geojson', 'image')),
  display_order   INT NOT NULL DEFAULT 0,
  capacity        INT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_halls_updated_at
  BEFORE UPDATE ON public.halls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Exhibitors
CREATE TABLE public.exhibitors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name    TEXT NOT NULL,
  description     TEXT,
  contact_person  TEXT NOT NULL,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  website         TEXT,
  logo_url        TEXT,
  status          exhibitor_status NOT NULL DEFAULT 'pending',
  country         TEXT,
  industry        TEXT,
  booth_size      TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exhibitors_status ON public.exhibitors(status);
CREATE TRIGGER set_exhibitors_updated_at
  BEFORE UPDATE ON public.exhibitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stands
CREATE TABLE public.stands (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id         UUID NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  exhibitor_id    UUID REFERENCES public.exhibitors(id) ON DELETE SET NULL,
  stand_number    TEXT NOT NULL,
  label           TEXT,
  polygon         JSONB NOT NULL,
  status          stand_status NOT NULL DEFAULT 'available',
  area_sqm        NUMERIC(10,2),
  price           NUMERIC(12,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_stand_per_hall UNIQUE (hall_id, stand_number)
);

CREATE INDEX idx_stands_hall ON public.stands(hall_id);
CREATE INDEX idx_stands_exhibitor ON public.stands(exhibitor_id);
CREATE TRIGGER set_stands_updated_at
  BEFORE UPDATE ON public.stands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Events
CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  hall_id         UUID REFERENCES public.halls(id) ON DELETE SET NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  status          event_status NOT NULL DEFAULT 'draft',
  speaker         TEXT,
  capacity        INT,
  image_url       TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

CREATE INDEX idx_events_hall ON public.events(hall_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Visitors
CREATE TABLE public.visitors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  job_title       TEXT,
  country         TEXT,
  badge_id        TEXT UNIQUE,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitors_email ON public.visitors(email);
CREATE TRIGGER set_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Leads
CREATE TABLE public.leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibitor_id    UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  visitor_id      UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  source          lead_source NOT NULL DEFAULT 'manual',
  notes           TEXT,
  is_qualified    BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_lead UNIQUE (exhibitor_id, visitor_id, source)
);

CREATE INDEX idx_leads_exhibitor ON public.leads(exhibitor_id);
CREATE INDEX idx_leads_visitor ON public.leads(visitor_id);

-- Event Attendance
CREATE TABLE public.event_attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  visitor_id      UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_visitor UNIQUE (event_id, visitor_id)
);

-- Engagement Logs
CREATE TABLE public.engagement_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id      UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  exhibitor_id    UUID REFERENCES public.exhibitors(id) ON DELETE SET NULL,
  event_id        UUID REFERENCES public.events(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.v_leads_per_exhibitor AS
SELECT
  e.id AS exhibitor_id,
  e.company_name,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.is_qualified) AS qualified_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'qr_scan') AS qr_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'nfc_tap') AS nfc_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'manual') AS manual_leads
FROM public.exhibitors e
LEFT JOIN public.leads l ON l.exhibitor_id = e.id
GROUP BY e.id, e.company_name;

CREATE OR REPLACE VIEW public.v_event_participation AS
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
FROM public.events ev
LEFT JOIN public.halls h ON h.id = ev.hall_id
LEFT JOIN public.event_attendance ea ON ea.event_id = ev.id
GROUP BY ev.id, ev.name, ev.start_time, h.name, ev.capacity;

CREATE OR REPLACE VIEW public.v_daily_engagement AS
SELECT
  DATE(occurred_at) AS day,
  action,
  COUNT(*) AS total_actions,
  COUNT(DISTINCT visitor_id) AS unique_visitors
FROM public.engagement_logs
GROUP BY DATE(occurred_at), action
ORDER BY day DESC, total_actions DESC;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS admin_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_editor_or_above()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor') AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = TRUE
  );
$$;

-- Profiles policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- Standard CRUD policies for all data tables
CREATE POLICY "halls_select" ON public.halls FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "halls_insert" ON public.halls FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "halls_update" ON public.halls FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "halls_delete" ON public.halls FOR DELETE USING (public.is_admin_or_above());

CREATE POLICY "exhibitors_select" ON public.exhibitors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "exhibitors_insert" ON public.exhibitors FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "exhibitors_update" ON public.exhibitors FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "exhibitors_delete" ON public.exhibitors FOR DELETE USING (public.is_admin_or_above());

CREATE POLICY "stands_select" ON public.stands FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stands_insert" ON public.stands FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "stands_update" ON public.stands FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "stands_delete" ON public.stands FOR DELETE USING (public.is_admin_or_above());

CREATE POLICY "events_select" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (public.is_editor_or_above());
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (public.is_editor_or_above());
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (public.is_admin_or_above());

CREATE POLICY "visitors_select" ON public.visitors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "visitors_insert" ON public.visitors FOR INSERT WITH CHECK (public.is_editor_or_above());

CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (public.is_editor_or_above());

CREATE POLICY "event_attendance_select" ON public.event_attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_attendance_insert" ON public.event_attendance FOR INSERT WITH CHECK (public.is_editor_or_above());

CREATE POLICY "engagement_logs_select" ON public.engagement_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "engagement_logs_insert" ON public.engagement_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_logs;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Halls
INSERT INTO public.halls (id, name, description, display_order, capacity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Hall 1 - International Pavilion', 'Main international exhibitor hall with 50+ booths', 1, 200, TRUE),
  ('a1000000-0000-0000-0000-000000000002', 'Hall 2 - Technology & Innovation', 'Tech startups, software, and IT services', 2, 150, TRUE),
  ('a1000000-0000-0000-0000-000000000003', 'Hall 3 - Agriculture & Mining', 'Agricultural equipment, mining technology', 3, 180, TRUE),
  ('a1000000-0000-0000-0000-000000000004', 'Hall 4 - SME Village', 'Small and medium enterprises showcase', 4, 100, TRUE),
  ('a1000000-0000-0000-0000-000000000005', 'Outdoor Exhibition Area', 'Large machinery and vehicle displays', 5, 500, TRUE);

-- Exhibitors
INSERT INTO public.exhibitors (id, company_name, description, contact_person, contact_email, contact_phone, website, status, country, industry, booth_size) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Econet Wireless', 'Leading telecommunications provider in Zimbabwe', 'Tendai Moyo', 'tendai@econet.co.zw', '+263 4 486 486', 'https://econet.co.zw', 'active', 'Zimbabwe', 'Telecommunications', '6x6'),
  ('b1000000-0000-0000-0000-000000000002', 'Delta Corporation', 'Beverages and food manufacturing', 'Sharon Ndlovu', 'sharon@delta.co.zw', '+263 4 883 886', 'https://delta.co.zw', 'active', 'Zimbabwe', 'Manufacturing', '6x6'),
  ('b1000000-0000-0000-0000-000000000003', 'FBC Holdings', 'Financial services and banking', 'Kudzai Chigwedere', 'kudzai@fbc.co.zw', '+263 4 700 373', 'https://fbc.co.zw', 'active', 'Zimbabwe', 'Financial Services', '3x3'),
  ('b1000000-0000-0000-0000-000000000004', 'Huawei Technologies', 'Global ICT solutions provider', 'Li Wei', 'li.wei@huawei.com', '+263 4 338 260', 'https://huawei.com', 'active', 'China', 'ICT', '6x9'),
  ('b1000000-0000-0000-0000-000000000005', 'National Foods', 'Food processing and distribution', 'Rudo Makoni', 'rudo@natfoods.co.zw', '+263 4 608 061', 'https://nationalfoods.co.zw', 'active', 'Zimbabwe', 'Food & Beverage', '3x6'),
  ('b1000000-0000-0000-0000-000000000006', 'Zimplats Holdings', 'Platinum group metals mining', 'James Banda', 'james@zimplats.com', '+263 4 886 878', 'https://zimplats.com', 'approved', 'Zimbabwe', 'Mining', '6x6'),
  ('b1000000-0000-0000-0000-000000000007', 'TelOne', 'Fixed telecommunications operator', 'Grace Mupfumira', 'grace@telone.co.zw', '+263 4 798 911', 'https://telone.co.zw', 'pending', 'Zimbabwe', 'Telecommunications', '3x3'),
  ('b1000000-0000-0000-0000-000000000008', 'South African Airways', 'Regional airline', 'Thabo Molefe', 'thabo@flysaa.com', '+27 11 978 1111', 'https://flysaa.com', 'active', 'South Africa', 'Aviation', '3x3');

-- Stands
INSERT INTO public.stands (hall_id, exhibitor_id, stand_number, label, polygon, status, area_sqm, price) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'H1-A01', 'Econet', '[{"x":50,"y":50},{"x":150,"y":50},{"x":150,"y":150},{"x":50,"y":150}]'::jsonb, 'booked', 36.00, 5000.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'H1-A02', 'Delta', '[{"x":160,"y":50},{"x":260,"y":50},{"x":260,"y":150},{"x":160,"y":150}]'::jsonb, 'booked', 36.00, 5000.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'H1-A03', 'Huawei', '[{"x":270,"y":50},{"x":420,"y":50},{"x":420,"y":200},{"x":270,"y":200}]'::jsonb, 'booked', 54.00, 8000.00),
  ('a1000000-0000-0000-0000-000000000001', NULL, 'H1-B01', NULL, '[{"x":50,"y":170},{"x":150,"y":170},{"x":150,"y":270},{"x":50,"y":270}]'::jsonb, 'available', 36.00, 5000.00),
  ('a1000000-0000-0000-0000-000000000001', NULL, 'H1-B02', NULL, '[{"x":160,"y":170},{"x":260,"y":170},{"x":260,"y":270},{"x":160,"y":270}]'::jsonb, 'available', 36.00, 5000.00),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'H2-A01', 'FBC', '[{"x":50,"y":50},{"x":130,"y":50},{"x":130,"y":130},{"x":50,"y":130}]'::jsonb, 'booked', 9.00, 2500.00),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'H3-A01', 'Zimplats', '[{"x":50,"y":50},{"x":200,"y":50},{"x":200,"y":150},{"x":50,"y":150}]'::jsonb, 'reserved', 36.00, 5000.00);

-- Events
INSERT INTO public.events (name, description, hall_id, start_time, end_time, status, speaker, capacity) VALUES
  ('ZITF Opening Ceremony', 'Official opening of the 2026 Zimbabwe International Trade Fair', 'a1000000-0000-0000-0000-000000000001', '2026-04-22 09:00:00+02', '2026-04-22 11:00:00+02', 'published', 'Hon. Minister of Industry', 500),
  ('Digital Transformation Summit', 'Panel on AI and digital transformation in Southern Africa', 'a1000000-0000-0000-0000-000000000002', '2026-04-22 14:00:00+02', '2026-04-22 17:00:00+02', 'published', 'Dr. Farai Mutambanengwe', 150),
  ('Mining Investment Forum', 'Presentations on mining investment opportunities', 'a1000000-0000-0000-0000-000000000003', '2026-04-23 09:00:00+02', '2026-04-23 12:00:00+02', 'published', 'Chamber of Mines Panel', 180),
  ('SME Networking Breakfast', 'Networking event for small business owners', 'a1000000-0000-0000-0000-000000000004', '2026-04-23 07:30:00+02', '2026-04-23 09:00:00+02', 'draft', NULL, 80),
  ('AgriTech Innovation Showcase', 'Demonstrations of latest agricultural technology', 'a1000000-0000-0000-0000-000000000003', '2026-04-24 10:00:00+02', '2026-04-24 13:00:00+02', 'published', 'Dr. Chipo Nyambuya', 120),
  ('ZITF Closing Gala', 'Awards and closing ceremony', 'a1000000-0000-0000-0000-000000000001', '2026-04-26 18:00:00+02', '2026-04-26 22:00:00+02', 'draft', NULL, 300);

-- Visitors
INSERT INTO public.visitors (id, full_name, email, phone, company, job_title, country, badge_id) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Tatenda Moyo', 'tatenda@gmail.com', '+263 77 123 4567', 'ZPC Ltd', 'Procurement Manager', 'Zimbabwe', 'BADGE-001'),
  ('c1000000-0000-0000-0000-000000000002', 'Sipho Dube', 'sipho.dube@outlook.com', '+263 78 234 5678', 'Old Mutual', 'Investment Analyst', 'Zimbabwe', 'BADGE-002'),
  ('c1000000-0000-0000-0000-000000000003', 'Nokuthula Ncube', 'nokuthula@yahoo.com', '+263 71 345 6789', 'NSSA', 'Director', 'Zimbabwe', 'BADGE-003'),
  ('c1000000-0000-0000-0000-000000000004', 'Pieter van der Merwe', 'pieter@sasol.co.za', '+27 82 456 7890', 'Sasol', 'Business Dev', 'South Africa', 'BADGE-004'),
  ('c1000000-0000-0000-0000-000000000005', 'Chiedza Mhizha', 'chiedza@techzim.co.zw', '+263 73 567 8901', 'TechZim', 'Journalist', 'Zimbabwe', 'BADGE-005');

-- Leads
INSERT INTO public.leads (exhibitor_id, visitor_id, source, is_qualified, notes) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'qr_scan', TRUE, 'Interested in enterprise solutions'),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'nfc_tap', FALSE, NULL),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'manual', TRUE, 'Wants bulk pricing'),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'qr_scan', TRUE, 'Government procurement'),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'qr_scan', TRUE, '5G infrastructure partnership'),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', 'manual', FALSE, 'Press inquiry');
