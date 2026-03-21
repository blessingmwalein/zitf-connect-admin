"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import { PolygonDrawControl } from "./polygon-draw-control";
import type { GeoPoint } from "@/types/database.types";
import { ZITF_CENTER, ZITF_DEFAULT_ZOOM } from "./map-container-inner";
import "@/components/maps/leaflet-icons";

interface Props {
  polygon?: GeoPoint[] | null;
  onChange: (coords: GeoPoint[]) => void;
}

export function HallPolygonEditorInner({ polygon, onChange }: Props) {
  const center =
    polygon && polygon.length >= 3
      ? getCentroid(polygon)
      : ZITF_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={polygon && polygon.length >= 3 ? 18 : ZITF_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-[350px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PolygonDrawControl
        existingPolygon={polygon}
        onPolygonChange={onChange}
        drawColor="#007AFF"
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
