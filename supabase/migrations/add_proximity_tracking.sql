-- Migration: Real-Time Proximity Heatmap Tracking System
-- Enables GPS-based attendee tracking, zone analytics, and heatmap generation
-- Requires PostGIS extension (available on Supabase)

-- ============================================================
-- 1. Enable PostGIS extension for geospatial operations
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 2. Location tracking consent enum
-- ============================================================
DO $$ BEGIN
  CREATE TYPE location_consent_status AS ENUM ('granted', 'denied', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Visitor location consent tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS location_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  status location_consent_status NOT NULL DEFAULT 'granted',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visitor_id)
);

-- ============================================================
-- 4. Raw location logs (high-frequency GPS data)
-- ============================================================
CREATE TABLE IF NOT EXISTS location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Use hashed visitor ID for privacy (SHA-256 of visitor UUID)
  visitor_hash TEXT NOT NULL,
  -- Original visitor reference (nullable for full anonymization mode)
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  -- PostGIS point geometry (SRID 4326 = WGS84 / GPS standard)
  location GEOMETRY(Point, 4326) NOT NULL,
  -- Raw coordinates for quick access without PostGIS functions
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  -- GPS metadata
  accuracy DOUBLE PRECISION, -- meters
  altitude DOUBLE PRECISION, -- meters
  speed DOUBLE PRECISION, -- m/s
  heading DOUBLE PRECISION, -- degrees from north
  -- Network metadata (optional)
  network_type TEXT, -- wifi, 4g, 5g
  wifi_ssid TEXT,
  signal_strength INTEGER, -- RSSI in dBm
  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL, -- when the device captured the location
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- when the server received it
  -- Idempotency key to prevent duplicate ingestion
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for idempotent ingestion
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_logs_idempotency
  ON location_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Time-based partitioning index (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_location_logs_recorded_at
  ON location_logs(recorded_at DESC);

-- Spatial index for geo queries (proximity, containment)
CREATE INDEX IF NOT EXISTS idx_location_logs_location
  ON location_logs USING GIST(location);

-- Visitor lookup index
CREATE INDEX IF NOT EXISTS idx_location_logs_visitor_hash
  ON location_logs(visitor_hash, recorded_at DESC);

-- Composite index for recent locations by visitor
CREATE INDEX IF NOT EXISTS idx_location_logs_visitor_recent
  ON location_logs(visitor_id, recorded_at DESC) WHERE visitor_id IS NOT NULL;

-- ============================================================
-- 5. Venue zones (geo-fenced areas: halls, booths, entrances, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS venue_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'hall', -- hall, booth, entrance, food_court, restroom, outdoor
  -- PostGIS polygon for zone boundary
  boundary GEOMETRY(Polygon, 4326) NOT NULL,
  -- Reference to hall if this zone corresponds to a hall
  hall_id UUID REFERENCES halls(id) ON DELETE SET NULL,
  -- Reference to stand if this zone corresponds to a stand
  stand_id UUID REFERENCES stands(id) ON DELETE SET NULL,
  -- Display properties
  color TEXT DEFAULT '#3388ff',
  floor_level INTEGER DEFAULT 0,
  capacity INTEGER,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index for zone containment queries
CREATE INDEX IF NOT EXISTS idx_venue_zones_boundary
  ON venue_zones USING GIST(boundary);

-- ============================================================
-- 6. Heatmap tiles (pre-aggregated density grid)
-- ============================================================
CREATE TABLE IF NOT EXISTS heatmap_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Geohash identifier for the tile (precision 7 = ~76m x 76m)
  geohash TEXT NOT NULL,
  -- Tile center point
  center GEOMETRY(Point, 4326) NOT NULL,
  -- Time bucket (5-minute intervals for efficient aggregation)
  time_bucket TIMESTAMPTZ NOT NULL,
  -- Density metrics
  visitor_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  -- Weighted intensity (accounts for dwell time)
  intensity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  -- Bounding box for quick spatial lookups
  bounds GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite unique index for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_heatmap_tiles_geohash_bucket
  ON heatmap_tiles(geohash, time_bucket);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_heatmap_tiles_time_bucket
  ON heatmap_tiles(time_bucket DESC);

-- Spatial queries for map viewport
CREATE INDEX IF NOT EXISTS idx_heatmap_tiles_center
  ON heatmap_tiles USING GIST(center);

-- ============================================================
-- 7. Zone occupancy snapshots (aggregated per zone per interval)
-- ============================================================
CREATE TABLE IF NOT EXISTS zone_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES venue_zones(id) ON DELETE CASCADE,
  -- Time bucket (5-minute intervals)
  time_bucket TIMESTAMPTZ NOT NULL,
  -- Counts
  current_count INTEGER NOT NULL DEFAULT 0,
  peak_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  -- Average dwell time in seconds for this interval
  avg_dwell_seconds DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite unique for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_zone_occupancy_zone_bucket
  ON zone_occupancy(zone_id, time_bucket);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_zone_occupancy_time
  ON zone_occupancy(time_bucket DESC);

-- ============================================================
-- 8. Visitor dwell time tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS zone_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash TEXT NOT NULL,
  zone_id UUID NOT NULL REFERENCES venue_zones(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL,
  exited_at TIMESTAMPTZ,
  dwell_seconds DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN exited_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (exited_at - entered_at))
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zone_visits_visitor
  ON zone_visits(visitor_hash, entered_at DESC);

CREATE INDEX IF NOT EXISTS idx_zone_visits_zone
  ON zone_visits(zone_id, entered_at DESC);

-- ============================================================
-- 9. Helper functions
-- ============================================================

-- Function: Get current zone for a point
CREATE OR REPLACE FUNCTION get_zone_for_point(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TABLE(zone_id UUID, zone_name TEXT, zone_type TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT vz.id, vz.name, vz.zone_type
    FROM venue_zones vz
    WHERE ST_Contains(vz.boundary, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
      AND vz.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Count visitors in a zone within a time window
CREATE OR REPLACE FUNCTION count_visitors_in_zone(
  p_zone_id UUID,
  p_since TIMESTAMPTZ DEFAULT now() - INTERVAL '5 minutes'
)
RETURNS TABLE(total_count BIGINT, unique_count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT
      COUNT(*)::BIGINT AS total_count,
      COUNT(DISTINCT ll.visitor_hash)::BIGINT AS unique_count
    FROM location_logs ll
    JOIN venue_zones vz ON ST_Contains(vz.boundary, ll.location)
    WHERE vz.id = p_zone_id
      AND ll.recorded_at >= p_since;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Generate heatmap data for a viewport and time range
CREATE OR REPLACE FUNCTION get_heatmap_data(
  p_min_lat DOUBLE PRECISION,
  p_min_lng DOUBLE PRECISION,
  p_max_lat DOUBLE PRECISION,
  p_max_lng DOUBLE PRECISION,
  p_since TIMESTAMPTZ DEFAULT now() - INTERVAL '5 minutes',
  p_until TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION, intensity DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
    SELECT
      ll.latitude AS lat,
      ll.longitude AS lng,
      -- Weight by recency: more recent = higher intensity
      (1.0 - EXTRACT(EPOCH FROM (p_until - ll.recorded_at))
        / GREATEST(EXTRACT(EPOCH FROM (p_until - p_since)), 1))::DOUBLE PRECISION AS intensity
    FROM location_logs ll
    WHERE ll.recorded_at BETWEEN p_since AND p_until
      AND ll.latitude BETWEEN p_min_lat AND p_max_lat
      AND ll.longitude BETWEEN p_min_lng AND p_max_lng;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get zone traffic summary
CREATE OR REPLACE FUNCTION get_zone_traffic_summary(
  p_since TIMESTAMPTZ DEFAULT now() - INTERVAL '1 hour'
)
RETURNS TABLE(
  zone_id UUID,
  zone_name TEXT,
  zone_type TEXT,
  visitor_count BIGINT,
  unique_visitors BIGINT,
  avg_dwell_seconds DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      vz.id AS zone_id,
      vz.name AS zone_name,
      vz.zone_type AS zone_type,
      COUNT(ll.id)::BIGINT AS visitor_count,
      COUNT(DISTINCT ll.visitor_hash)::BIGINT AS unique_visitors,
      COALESCE(AVG(
        CASE WHEN zv.dwell_seconds IS NOT NULL THEN zv.dwell_seconds ELSE 0 END
      ), 0)::DOUBLE PRECISION AS avg_dwell_seconds
    FROM venue_zones vz
    LEFT JOIN location_logs ll
      ON ST_Contains(vz.boundary, ll.location)
      AND ll.recorded_at >= p_since
    LEFT JOIN zone_visits zv
      ON zv.zone_id = vz.id
      AND zv.entered_at >= p_since
    WHERE vz.is_active = true
    GROUP BY vz.id, vz.name, vz.zone_type
    ORDER BY visitor_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 10. Materialized view for peak times analysis
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hourly_zone_traffic AS
SELECT
  vz.id AS zone_id,
  vz.name AS zone_name,
  date_trunc('hour', ll.recorded_at) AS hour,
  COUNT(DISTINCT ll.visitor_hash) AS unique_visitors,
  COUNT(*) AS total_pings
FROM location_logs ll
JOIN venue_zones vz ON ST_Contains(vz.boundary, ll.location)
WHERE ll.recorded_at >= now() - INTERVAL '7 days'
GROUP BY vz.id, vz.name, date_trunc('hour', ll.recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hourly_zone_traffic
  ON mv_hourly_zone_traffic(zone_id, hour);

-- ============================================================
-- 11. Auto-update timestamps trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_location_consents_updated_at
    BEFORE UPDATE ON location_consents
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_venue_zones_updated_at
    BEFORE UPDATE ON venue_zones
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_heatmap_tiles_updated_at
    BEFORE UPDATE ON heatmap_tiles
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 12. RLS Policies
-- ============================================================

-- location_logs: service role only (no direct client access)
ALTER TABLE location_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on location_logs"
  ON location_logs FOR ALL
  USING (auth.role() = 'service_role');

-- venue_zones: public read, admin write
ALTER TABLE venue_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active venue zones"
  ON venue_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access on venue_zones"
  ON venue_zones FOR ALL
  USING (auth.role() = 'service_role');

-- heatmap_tiles: public read, service write
ALTER TABLE heatmap_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read heatmap tiles"
  ON heatmap_tiles FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on heatmap_tiles"
  ON heatmap_tiles FOR ALL
  USING (auth.role() = 'service_role');

-- zone_occupancy: public read, service write
ALTER TABLE zone_occupancy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read zone occupancy"
  ON zone_occupancy FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on zone_occupancy"
  ON zone_occupancy FOR ALL
  USING (auth.role() = 'service_role');

-- zone_visits: service role only
ALTER TABLE zone_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on zone_visits"
  ON zone_visits FOR ALL
  USING (auth.role() = 'service_role');

-- location_consents: visitors can manage own, service role full access
ALTER TABLE location_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can read own consent"
  ON location_consents FOR SELECT
  USING (visitor_id = auth.uid());

CREATE POLICY "Visitors can update own consent"
  ON location_consents FOR UPDATE
  USING (visitor_id = auth.uid());

CREATE POLICY "Service role full access on location_consents"
  ON location_consents FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 13. Enable Realtime on key tracking tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE heatmap_tiles;
ALTER PUBLICATION supabase_realtime ADD TABLE zone_occupancy;

-- ============================================================
-- 14. Data retention: auto-purge old raw location logs (> 30 days)
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_location_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM location_logs WHERE recorded_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule this via pg_cron or application-level cron:
-- SELECT cron.schedule('purge-location-logs', '0 3 * * *', 'SELECT purge_old_location_logs()');
