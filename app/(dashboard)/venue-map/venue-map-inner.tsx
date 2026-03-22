"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Popup, Marker, Polyline, CircleMarker, useMap } from "react-leaflet";
import Link from "next/link";
import L from "leaflet";
import { ZITF_CENTER, ZITF_DEFAULT_ZOOM } from "@/components/maps/map-container-inner";
import "@/components/maps/leaflet-icons";

const HALL_COLORS = [
  "#F69825", "#34C759", "#007AFF", "#AF52DE",
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
  geo_polygon: [number, number][] | null;
}

interface Props {
  halls: Hall[];
  stands: Stand[];
  selectedStand: Stand | null;
}

function FlyToStand({ stand }: { stand: Stand | null }) {
  const map = useMap();
  useEffect(() => {
    if (stand?.latitude && stand?.longitude) {
      map.flyTo([stand.latitude, stand.longitude], 20, { duration: 1 });
    }
  }, [stand, map]);
  return null;
}

function UserLocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        // geolocation denied or unavailable
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map]);

  if (!position) return null;

  return (
    <>
      {/* Outer pulse */}
      <CircleMarker
        center={position}
        radius={20}
        pathOptions={{
          color: "#4285F4",
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          weight: 0,
        }}
      />
      {/* Inner dot */}
      <CircleMarker
        center={position}
        radius={7}
        pathOptions={{
          color: "#FFFFFF",
          fillColor: "#4285F4",
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Popup>Your location</Popup>
      </CircleMarker>
    </>
  );
}

function RouteLine({ from, to }: { from: [number, number] | null; to: [number, number] | null }) {
  if (!from || !to) return null;

  const distance = L.latLng(from).distanceTo(L.latLng(to));
  const distanceText = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  return (
    <Polyline
      positions={[from, to]}
      pathOptions={{
        color: "#4285F4",
        weight: 3,
        dashArray: "8, 8",
        opacity: 0.8,
      }}
    >
      <Popup>~{distanceText} walking distance</Popup>
    </Polyline>
  );
}

export function VenueMapInner({ halls, stands, selectedStand }: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  const exhibitorMarkers = stands.filter(
    (s) => s.latitude != null && s.longitude != null && s.exhibitor_name
  );

  const selectedPos: [number, number] | null =
    selectedStand?.latitude && selectedStand?.longitude
      ? [selectedStand.latitude, selectedStand.longitude]
      : null;

  return (
    <MapContainer
      center={ZITF_CENTER}
      zoom={ZITF_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fly to selected stand */}
      <FlyToStand stand={selectedStand} />

      {/* User GPS position */}
      <UserLocationMarker />

      {/* Route line from user to selected stand */}
      <RouteLine from={userPos} to={selectedPos} />

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
                  View Hall &rarr;
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
                View Stand &rarr;
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
