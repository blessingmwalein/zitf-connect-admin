"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import { PolygonDrawControl } from "./polygon-draw-control";
import type { GeoPoint } from "@/types/database.types";
import { ZITF_CENTER, ZITF_DEFAULT_ZOOM } from "./map-container-inner";
import "@/components/maps/leaflet-icons";

interface Props {
  hallPolygon?: GeoPoint[] | null;
  standPolygon?: GeoPoint[] | null;
  onChange: (coords: GeoPoint[]) => void;
}

export function StandPolygonEditorInner({
  hallPolygon,
  standPolygon,
  onChange,
}: Props) {
  const center =
    hallPolygon && hallPolygon.length >= 3
      ? getCentroid(hallPolygon)
      : standPolygon && standPolygon.length >= 3
        ? getCentroid(standPolygon)
        : ZITF_CENTER;

  const zoom =
    hallPolygon && hallPolygon.length >= 3 ? 19 : ZITF_DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-[300px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hall boundary as context (read-only) */}
      {hallPolygon && hallPolygon.length >= 3 && (
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
