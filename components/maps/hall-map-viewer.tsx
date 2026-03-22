"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./map-skeleton";
import type { GeoPoint } from "@/types/database.types";
import type { StandStatus } from "@/lib/constants";

const HallMapViewerInner = dynamic(
  () => import("./hall-map-viewer-inner").then((m) => m.HallMapViewerInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[300px] md:h-[400px] lg:h-[500px]" /> }
);

export interface HallStandData {
  id: string;
  stand_number: string;
  status: StandStatus;
  exhibitor_name: string | null;
  geo_polygon: GeoPoint[] | null;
}

interface HallMapViewerProps {
  hallPolygon: GeoPoint[];
  hallCenter: GeoPoint | null;
  stands: HallStandData[];
}

export function HallMapViewer(props: HallMapViewerProps) {
  return <HallMapViewerInner {...props} />;
}
