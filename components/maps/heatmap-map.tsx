"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./map-skeleton";
import type { HeatmapPoint } from "./heatmap-layer";

const HeatmapMapInner = dynamic(
  () =>
    import("./heatmap-map-inner").then((mod) => ({
      default: mod.HeatmapMapInner,
    })),
  {
    ssr: false,
    loading: () => <MapSkeleton className="h-[600px]" />,
  }
);

interface HeatmapMapProps {
  heatmapPoints: HeatmapPoint[];
  zones?: Array<{
    id: string;
    name: string;
    zone_type: string;
    boundary?: number[][];
    color?: string;
    currentCount?: number;
    capacity?: number;
  }>;
  showZones?: boolean;
  showPeopleMarkers?: boolean;
  heatmapRadius?: number;
  heatmapBlur?: number;
  heatmapOpacity?: number;
}

export function HeatmapMap(props: HeatmapMapProps) {
  return <HeatmapMapInner {...props} />;
}
