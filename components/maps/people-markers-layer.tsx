"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export interface PersonPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface PeopleMarkersLayerProps {
  points: PersonPoint[];
  /** Show individual person markers vs aggregated dots */
  showHeads?: boolean;
  /** Max markers to render (for performance) */
  maxMarkers?: number;
}

/**
 * Renders individual person-head markers on the map.
 * Each marker is a small SVG circle with a body silhouette,
 * coloured by intensity (blue = calm, red = dense area).
 */
export function PeopleMarkersLayer({
  points,
  showHeads = true,
  maxMarkers = 300,
}: PeopleMarkersLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map || !showHeads) {
      // Clean up if heads hidden
      if (layerGroupRef.current) {
        map?.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      return;
    }

    // Remove previous layer
    if (layerGroupRef.current) {
      map.removeLayer(layerGroupRef.current);
    }

    const group = L.layerGroup();

    // Limit markers for performance
    const visiblePoints = points.slice(0, maxMarkers);

    for (const point of visiblePoints) {
      const color = intensityToColor(point.intensity);

      const icon = L.divIcon({
        className: "person-marker",
        html: personSvg(color),
        iconSize: [20, 28],
        iconAnchor: [10, 28],
      });

      const marker = L.marker([point.lat, point.lng], { icon });
      group.addLayer(marker);
    }

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map, points, showHeads, maxMarkers]);

  return null;
}

/**
 * Generate an SVG person-head icon string.
 * A circle head on top of a half-body arc.
 */
function personSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28">
    <!-- shadow -->
    <ellipse cx="10" cy="27" rx="5" ry="1.5" fill="rgba(0,0,0,0.15)"/>
    <!-- body -->
    <path d="M4 24 C4 18, 6 16, 10 16 C14 16, 16 18, 16 24" fill="${fill}" opacity="0.85"/>
    <!-- head -->
    <circle cx="10" cy="10" r="6" fill="${fill}" stroke="white" stroke-width="1.5"/>
    <!-- face highlight -->
    <circle cx="10" cy="9" r="4" fill="white" opacity="0.15"/>
  </svg>`;
}

/**
 * Map intensity (0-1) to a colour from blue → green → yellow → red.
 */
function intensityToColor(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));

  if (t < 0.25) {
    // Blue to Cyan
    const f = t / 0.25;
    return interpolateColor("#3B82F6", "#06B6D4", f);
  } else if (t < 0.5) {
    // Cyan to Green
    const f = (t - 0.25) / 0.25;
    return interpolateColor("#06B6D4", "#22C55E", f);
  } else if (t < 0.75) {
    // Green to Yellow
    const f = (t - 0.5) / 0.25;
    return interpolateColor("#22C55E", "#EAB308", f);
  } else {
    // Yellow to Red
    const f = (t - 0.75) / 0.25;
    return interpolateColor("#EAB308", "#EF4444", f);
  }
}

function interpolateColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r},${g},${b})`;
}
