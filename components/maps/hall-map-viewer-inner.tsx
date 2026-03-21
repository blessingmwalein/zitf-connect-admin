"use client";

import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import Link from "next/link";
import type { GeoPoint } from "@/types/database.types";
import type { StandStatus } from "@/lib/constants";
import { STAND_STATUS_CONFIG } from "@/lib/constants";
import { STATUS_COLORS } from "./map-legend";
import "@/components/maps/leaflet-icons";

interface StandData {
  id: string;
  stand_number: string;
  status: StandStatus;
  exhibitor_name: string | null;
  geo_polygon: GeoPoint[] | null;
}

interface Props {
  hallPolygon: GeoPoint[];
  hallCenter: GeoPoint | null;
  stands: StandData[];
}

export function HallMapViewerInner({ hallPolygon, hallCenter, stands }: Props) {
  const center = hallCenter ?? getCentroid(hallPolygon);

  return (
    <MapContainer
      center={center}
      zoom={18}
      scrollWheelZoom={true}
      className="h-[400px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hall boundary */}
      <Polygon
        positions={hallPolygon}
        pathOptions={{
          color: "#6B7280",
          fillColor: "#6B7280",
          fillOpacity: 0.05,
          weight: 2,
          dashArray: "6 4",
        }}
      />

      {/* Stand polygons */}
      {stands.map((stand) => {
        if (!stand.geo_polygon || stand.geo_polygon.length < 3) return null;
        const color = STATUS_COLORS[stand.status] ?? "#8E8E93";
        return (
          <Polygon
            key={stand.id}
            positions={stand.geo_polygon}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{stand.stand_number}</p>
                <p className="text-xs text-gray-500">
                  {STAND_STATUS_CONFIG[stand.status].label}
                </p>
                {stand.exhibitor_name && (
                  <p className="text-xs">{stand.exhibitor_name}</p>
                )}
                <Link
                  href={`/stands/${stand.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Stand →
                </Link>
              </div>
            </Popup>
          </Polygon>
        );
      })}
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
