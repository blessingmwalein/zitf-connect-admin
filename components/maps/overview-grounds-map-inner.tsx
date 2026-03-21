"use client";

import { MapContainer, TileLayer, Polygon, Popup, Marker } from "react-leaflet";
import Link from "next/link";
import { ZITF_CENTER, ZITF_DEFAULT_ZOOM } from "./map-container-inner";
import "@/components/maps/leaflet-icons";

// Distinct colors for halls
const HALL_COLORS = [
  "#007AFF", "#34C759", "#FF9500", "#AF52DE",
  "#FF2D55", "#5AC8FA", "#5856D6", "#FF3B30",
];

interface Hall {
  id: string;
  name: string;
  geo_polygon: [number, number][] | null;
  geo_center: [number, number] | null;
}

interface Stand {
  id: string;
  stand_number: string;
  hall_id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  exhibitor_name: string | null;
}

interface Props {
  halls: Hall[];
  stands: Stand[];
}

export function OverviewGroundsMapInner({ halls, stands }: Props) {
  // Exhibitor markers — stands with lat/lng and an exhibitor
  const exhibitorMarkers = stands.filter(
    (s) => s.latitude != null && s.longitude != null && s.exhibitor_name
  );

  return (
    <MapContainer
      center={ZITF_CENTER}
      zoom={ZITF_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-[500px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hall polygons */}
      {halls.map((hall, idx) => {
        if (!hall.geo_polygon || hall.geo_polygon.length < 3) return null;
        const color = HALL_COLORS[idx % HALL_COLORS.length];
        const standCount = stands.filter((s) => s.hall_id === hall.id).length;
        return (
          <Polygon
            key={hall.id}
            positions={hall.geo_polygon}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{hall.name}</p>
                <p className="text-xs text-gray-500">
                  {standCount} stand{standCount !== 1 ? "s" : ""}
                </p>
                <Link
                  href={`/halls/${hall.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Hall →
                </Link>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {/* Exhibitor markers */}
      {exhibitorMarkers.map((s) => (
        <Marker key={s.id} position={[s.latitude!, s.longitude!]}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{s.exhibitor_name}</p>
              <p className="text-xs text-gray-500">Stand {s.stand_number}</p>
              <Link
                href={`/stands/${s.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View Stand →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
