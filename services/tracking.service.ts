"use server";

/**
 * Tracking & Heatmap Service
 * Server actions for fetching tracking data from the NestJS backend
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface ZoneTraffic {
  zone_id: string;
  zone_name: string;
  zone_type: string;
  visitor_count: number;
  unique_visitors: number;
  avg_dwell_seconds: number;
  capacity?: number;
  fill_rate?: number;
}

interface VenueStats {
  activeUsers: number;
  liveZoneOccupancy: Array<{ zoneId: string; count: number }>;
}

async function fetchBackend<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`/api${path}`, BACKEND_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      });
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Get live heatmap data (from in-memory active users)
 */
export async function getLiveHeatmapData(): Promise<{
  points: HeatmapPoint[];
  activeUsers: number;
}> {
  const data = await fetchBackend<{
    points: HeatmapPoint[];
    activeUsers: number;
  }>("/tracking/heatmap/live");

  return data || { points: [], activeUsers: 0 };
}

/**
 * Get historical heatmap data for a viewport and time range
 */
export async function getHeatmapData(params: {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  since?: string;
  until?: string;
}): Promise<{ points: HeatmapPoint[]; count: number }> {
  const data = await fetchBackend<{ points: HeatmapPoint[]; count: number }>(
    "/tracking/heatmap",
    {
      minLat: params.minLat.toString(),
      minLng: params.minLng.toString(),
      maxLat: params.maxLat.toString(),
      maxLng: params.maxLng.toString(),
      ...(params.since && { since: params.since }),
      ...(params.until && { until: params.until }),
    }
  );

  return data || { points: [], count: 0 };
}

/**
 * Get zone traffic summary
 */
export async function getZoneTraffic(params?: {
  since?: string;
  zoneType?: string;
}): Promise<ZoneTraffic[]> {
  const data = await fetchBackend<{ zones: ZoneTraffic[] }>(
    "/tracking/zones/traffic",
    params as Record<string, string>
  );

  return data?.zones || [];
}

/**
 * Get live venue stats
 */
export async function getVenueStats(): Promise<VenueStats> {
  const data = await fetchBackend<VenueStats>("/tracking/stats");
  return data || { activeUsers: 0, liveZoneOccupancy: [] };
}

/**
 * Get most popular zones
 */
export async function getPopularZones(params?: {
  since?: string;
  limit?: number;
}): Promise<
  Array<{
    zone_id: string;
    zone_name: string;
    zone_type: string;
    unique_visitors: number;
    avg_dwell_minutes: number;
  }>
> {
  const data = await fetchBackend<{
    zones: Array<{
      zone_id: string;
      zone_name: string;
      zone_type: string;
      unique_visitors: number;
      avg_dwell_minutes: number;
    }>;
  }>("/tracking/zones/popular", {
    ...(params?.since && { since: params.since }),
    ...(params?.limit && { limit: params.limit.toString() }),
  });

  return data?.zones || [];
}

/**
 * Get peak traffic times
 */
export async function getPeakTimes(params?: {
  zoneId?: string;
  days?: number;
}): Promise<Array<{ zone_name: string; hour: number; unique_visitors: number }>> {
  const data = await fetchBackend<{
    peaks: Array<{ zone_name: string; hour: number; unique_visitors: number }>;
  }>("/tracking/zones/peak-times", {
    ...(params?.zoneId && { zoneId: params.zoneId }),
    ...(params?.days && { days: params.days.toString() }),
  });

  return data?.peaks || [];
}

/**
 * Get zone occupancy timeline (for charts)
 */
export async function getZoneTimeline(params: {
  startDate: string;
  endDate: string;
  zoneId?: string;
  intervalMinutes?: number;
}): Promise<
  Array<{
    zone_id: string;
    zone_name: string;
    time_bucket: string;
    current_count: number;
    peak_count: number;
    unique_visitors: number;
  }>
> {
  const data = await fetchBackend<{
    timeline: Array<{
      zone_id: string;
      zone_name: string;
      time_bucket: string;
      current_count: number;
      peak_count: number;
      unique_visitors: number;
    }>;
  }>("/tracking/zones/occupancy/timeline", {
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.zoneId && { zoneId: params.zoneId }),
    ...(params.intervalMinutes && { intervalMinutes: params.intervalMinutes.toString() }),
  });

  return data?.timeline || [];
}

/**
 * List all venue zones
 */
export async function getVenueZones(): Promise<
  Array<{
    id: string;
    name: string;
    zone_type: string;
    is_active: boolean;
    capacity: number | null;
    color: string;
  }>
> {
  const data = await fetchBackend<{
    zones: Array<{
      id: string;
      name: string;
      zone_type: string;
      is_active: boolean;
      capacity: number | null;
      color: string;
    }>;
  }>("/tracking/zones");

  return data?.zones || [];
}
