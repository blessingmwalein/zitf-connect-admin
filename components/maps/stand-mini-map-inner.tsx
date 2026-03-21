"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import type { GeoPoint } from "@/types/database.types";
import "@/components/maps/leaflet-icons";

interface Props {
  standPolygon: GeoPoint[];
  hallPolygon?: GeoPoint[] | null;
}

export function StandMiniMapInner({ standPolygon, hallPolygon }: Props) {
  const center = getCentroid(standPolygon);

  return (
    <MapContainer
      center={center}
      zoom={19}
      scrollWheelZoom={false}
      dragging={false}
      className="h-[250px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hall boundary context */}
      {hallPolygon && hallPolygon.length >= 3 && (
        <Polygon
          positions={hallPolygon}
          pathOptions={{
            color: "#6B7280",
            fillColor: "#6B7280",
            fillOpacity: 0.05,
            weight: 1,
            dashArray: "4 3",
          }}
        />
      )}

      {/* Stand polygon highlighted */}
      <Polygon
        positions={standPolygon}
        pathOptions={{
          color: "#007AFF",
          fillColor: "#007AFF",
          fillOpacity: 0.25,
          weight: 3,
        }}
      />
    </MapContainer>
  );
}

function getCentroid(points: GeoPoint[]): [number, number] {
  const sum = points.reduce(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
    [0, 0]
  );
  return [sum[0] / points.length, sum[1] / points.length];
}
