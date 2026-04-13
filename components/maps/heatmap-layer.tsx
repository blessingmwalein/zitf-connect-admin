"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<number, string>;
}

/**
 * Leaflet.heat overlay for rendering density heatmap on the map.
 * Points are [lat, lng, intensity] tuples pushed into the heat layer.
 */
export function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 20,
  max = 1.0,
  minOpacity = 0.3,
  gradient,
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heatData: L.HeatLatLngTuple[] = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    const heatLayer = (L as any).heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max,
      minOpacity,
      ...(gradient && { gradient }),
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, radius, blur, maxZoom, max, minOpacity, gradient]);

  return null;
}
