"use client";

import { OverviewGroundsMap } from "@/components/maps/overview-grounds-map";
import { MapLegend } from "@/components/maps/map-legend";

interface Props {
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

export function OverviewMapWrapper({ halls, stands }: Props) {
  const hasAnyPolygon = halls.some(
    (h) => h.geo_polygon && h.geo_polygon.length >= 3
  );

  if (!hasAnyPolygon) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16 text-center">
        <p className="text-headline text-muted-foreground">
          No hall boundaries drawn yet
        </p>
        <p className="mt-1 text-caption-1 text-muted-foreground">
          Go to a hall&apos;s detail page and click &quot;Draw Boundary&quot; to see it on the map
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OverviewGroundsMap halls={halls} stands={stands} />
      <MapLegend />
    </div>
  );
}
