"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import { MapSkeleton } from "./map-skeleton";

const MapContainerInner = dynamic(
  () =>
    import("./map-container-inner").then((mod) => mod.MapContainerInner),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

interface DynamicMapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  scrollWheelZoom?: boolean;
}

export function DynamicMap(props: DynamicMapProps) {
  return <MapContainerInner {...props} />;
}
