"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/database.types";
import { MapSkeleton } from "./map-skeleton";

const StandMiniMapInner = dynamic(
  () => import("./stand-mini-map-inner").then((m) => m.StandMiniMapInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[250px]" /> }
);

interface StandMiniMapProps {
  standPolygon: GeoPoint[];
  hallPolygon?: GeoPoint[] | null;
}

export function StandMiniMap(props: StandMiniMapProps) {
  return <StandMiniMapInner {...props} />;
}
