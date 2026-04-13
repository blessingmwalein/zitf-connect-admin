"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { HeatmapLayer, type HeatmapPoint } from "./heatmap-layer";
import { PeopleMarkersLayer } from "./people-markers-layer";
import "@/components/maps/leaflet-icons";

const ZITF_CENTER: LatLngExpression = [-20.1575, 28.5833];
const ZITF_DEFAULT_ZOOM = 17;

const HALL_COLORS = [
  "#007AFF",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#5AC8FA",
  "#FF2D55",
  "#FFCC00",
];

interface ZoneOverlay {
  id: string;
  name: string;
  zone_type: string;
  boundary?: number[][];
  color?: string;
  currentCount?: number;
  capacity?: number;
}

interface HeatmapMapInnerProps {
  heatmapPoints: HeatmapPoint[];
  zones?: ZoneOverlay[];
  showZones?: boolean;
  showPeopleMarkers?: boolean;
  heatmapRadius?: number;
  heatmapBlur?: number;
  heatmapOpacity?: number;
}

export function HeatmapMapInner({
  heatmapPoints,
  zones = [],
  showZones = true,
  showPeopleMarkers = true,
  heatmapRadius = 25,
  heatmapBlur = 15,
  heatmapOpacity = 0.4,
}: HeatmapMapInnerProps) {
  const gradient = useMemo(
    () => ({
      0.0: "#0000ff",
      0.25: "#00ffff",
      0.5: "#00ff00",
      0.75: "#ffff00",
      1.0: "#ff0000",
    }),
    []
  );

  return (
    <MapContainer
      center={ZITF_CENTER}
      zoom={ZITF_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Heatmap overlay */}
      <HeatmapLayer
        points={heatmapPoints}
        radius={heatmapRadius}
        blur={heatmapBlur}
        minOpacity={heatmapOpacity}
        gradient={gradient}
      />

      {/* People head markers */}
      <PeopleMarkersLayer
        points={heatmapPoints}
        showHeads={showPeopleMarkers}
        maxMarkers={300}
      />

      {/* Zone polygons overlay */}
      {showZones &&
        zones.map((zone, idx) => {
          if (!zone.boundary || zone.boundary.length < 3) return null;
          const positions = zone.boundary.map(
            (p) => [p[0], p[1]] as LatLngExpression
          );
          const color = zone.color || HALL_COLORS[idx % HALL_COLORS.length];

          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: 2,
                dashArray: "5, 5",
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{zone.name}</p>
                  <p className="text-muted-foreground capitalize">
                    {zone.zone_type}
                  </p>
                  {zone.currentCount !== undefined && (
                    <p className="mt-1">
                      Current: <strong>{zone.currentCount}</strong>
                      {zone.capacity && ` / ${zone.capacity}`}
                    </p>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}
    </MapContainer>
  );
}
