"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateHall } from "@/services/hall.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HallPolygonEditor } from "@/components/maps/hall-polygon-editor";
import { HallMapViewer } from "@/components/maps/hall-map-viewer";
import { MapLegend } from "@/components/maps/map-legend";
import type { GeoPoint } from "@/types/database.types";
import type { StandStatus } from "@/lib/constants";

interface HallData {
  id: string;
  name: string;
  geo_polygon: [number, number][] | null;
  geo_center: [number, number] | null;
}

interface StandItem {
  id: string;
  stand_number: string;
  status: StandStatus;
  exhibitor_name: string | null;
  area_sqm: number;
  geo_polygon: [number, number][] | null;
}

export function HallMapSection({
  hall,
  stands,
}: {
  hall: HallData;
  stands: StandItem[];
}) {
  const [editing, setEditing] = useState(false);
  const [polygon, setPolygon] = useState<GeoPoint[]>(
    (hall.geo_polygon as GeoPoint[]) ?? []
  );
  const [saving, setSaving] = useState(false);

  async function savePolygon() {
    if (polygon.length < 3) {
      toast.error("Draw at least 3 points for the hall boundary");
      return;
    }
    setSaving(true);
    try {
      // Compute center
      const center: GeoPoint = [
        polygon.reduce((s, p) => s + p[0], 0) / polygon.length,
        polygon.reduce((s, p) => s + p[1], 0) / polygon.length,
      ];
      const { error } = await updateHall(hall.id, {
        geo_polygon: polygon as any,
        geo_center: center as any,
      } as any);
      if (error) throw error;
      toast.success("Hall boundary saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save hall boundary");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="ios-card">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-headline">Hall Map</CardTitle>
          <CardDescription>
            {editing
              ? "Draw or edit the hall boundary on the map"
              : "Visual layout of stands within this hall"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPolygon((hall.geo_polygon as GeoPoint[]) ?? []);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={savePolygon} disabled={saving}>
                {saving ? "Saving..." : "Save Boundary"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {hall.geo_polygon ? "Edit Boundary" : "Draw Boundary"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <HallPolygonEditor
            polygon={polygon.length >= 3 ? polygon : null}
            onChange={setPolygon}
          />
        ) : hall.geo_polygon && (hall.geo_polygon as any[]).length >= 3 ? (
          <>
            <HallMapViewer
              hallPolygon={hall.geo_polygon as GeoPoint[]}
              hallCenter={hall.geo_center as GeoPoint | null}
              stands={stands.map((s) => ({
                id: s.id,
                stand_number: s.stand_number,
                status: s.status,
                exhibitor_name: s.exhibitor_name,
                geo_polygon: s.geo_polygon as GeoPoint[] | null,
              }))}
            />
            <MapLegend />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16 text-center">
            <p className="text-headline text-muted-foreground">
              No boundary drawn yet
            </p>
            <p className="mt-1 text-caption-1 text-muted-foreground">
              Click &quot;Draw Boundary&quot; to define this hall&apos;s area on the map
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
