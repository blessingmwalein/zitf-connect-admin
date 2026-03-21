"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "@/components/maps/leaflet-icons";

// ZITF Exhibition Centre, Bulawayo, Zimbabwe
export const ZITF_CENTER: LatLngExpression = [-20.1575, 28.5833];
export const ZITF_DEFAULT_ZOOM = 17;

interface MapContainerInnerProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  scrollWheelZoom?: boolean;
}

export function MapContainerInner({
  center = ZITF_CENTER,
  zoom = ZITF_DEFAULT_ZOOM,
  className = "h-[400px] w-full",
  children,
  scrollWheelZoom = true,
}: MapContainerInnerProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      className={`rounded-xl ${className}`}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
