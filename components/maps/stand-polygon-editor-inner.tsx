"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import { PolygonDrawControl } from "./polygon-draw-control";
import type { GeoPoint } from "@/types/database.types";
import { ZITF_CENTER, ZITF_DEFAULT_ZOOM } from "./map-container-inner";
import "@/components/maps/leaflet-icons";

interface Props {
  hallPolygon?: GeoPoint[] | null;
  standPolygon?: GeoPoint[] | null;
  onChange: (coords: GeoPoint[]) => void;
}

/** Fits the map to the hall boundary and locks panning to it */
function FitToHall({ hallPolygon }: { hallPolygon: GeoPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(hallPolygon.map(([lat, lng]) => L.latLng(lat, lng)));
    const padded = bounds.pad(0.3);
    map.fitBounds(padded);
    map.setMaxBounds(padded);
    map.setMinZoom(map.getZoom() - 2);
  }, [map, hallPolygon]);
  return null;
}

export function StandPolygonEditorInner({
  hallPolygon,
  standPolygon,
  onChange,
}: Props) {
  const hasHall = hallPolygon && hallPolygon.length >= 3;

  const center = hasHall
    ? getCentroid(hallPolygon)
    : standPolygon && standPolygon.length >= 3
      ? getCentroid(standPolygon)
      : ZITF_CENTER;

  const zoom = hasHall ? 19 : ZITF_DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-[300px] md:h-[400px] lg:h-[500px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Lock map to hall boundary */}
      {hasHall && <FitToHall hallPolygon={hallPolygon} />}

      {/* Hall boundary as context (read-only) */}
      {hasHall && (
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
      )}

      {/* Draw control for stand polygon */}
      <PolygonDrawControl
        existingPolygon={standPolygon}
        onPolygonChange={onChange}
        drawColor="#34C759"
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
