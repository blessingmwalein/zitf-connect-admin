-- Migration: Add geo-coordinate support for halls and stands
-- Enables interactive Leaflet map with real-world coordinates

-- 1. Add geo_polygon to halls (hall boundary as array of [lat, lng] pairs)
ALTER TABLE halls ADD COLUMN IF NOT EXISTS geo_polygon JSONB DEFAULT NULL;

-- 2. Add geo_center to halls (center point for map zoom)
ALTER TABLE halls ADD COLUMN IF NOT EXISTS geo_center JSONB DEFAULT NULL;

-- 3. Add latitude/longitude to stands (marker position for exhibitor)
ALTER TABLE stands ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT NULL;
ALTER TABLE stands ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;

-- 4. Make stands.polygon nullable (old pixel data becomes optional; geo data in geo-coords)
ALTER TABLE stands ALTER COLUMN polygon DROP NOT NULL;
ALTER TABLE stands ALTER COLUMN polygon SET DEFAULT NULL;

-- 5. Add geo_polygon to stands (stand boundary as array of [lat, lng] pairs)
ALTER TABLE stands ADD COLUMN IF NOT EXISTS geo_polygon JSONB DEFAULT NULL;
