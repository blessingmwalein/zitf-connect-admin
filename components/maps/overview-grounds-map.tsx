"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./map-skeleton";

const OverviewGroundsMapInner = dynamic(
  () => import("./overview-grounds-map-inner").then((m) => m.OverviewGroundsMapInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[500px]" /> }
);

interface OverviewGroundsMapProps {
  halls: {
    id: string;
    name: string;
    geo_polygon: [number, number][] | null;
    geo_center: [number, number] | null;
  }[];
  stands: {
    id: string;
    stand_number: string;
    hall_id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    exhibitor_name: string | null;
  }[];
}

export function OverviewGroundsMap(props: OverviewGroundsMapProps) {
  return <OverviewGroundsMapInner {...props} />;
}
