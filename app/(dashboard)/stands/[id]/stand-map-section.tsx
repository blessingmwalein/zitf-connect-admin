"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateStand } from "@/services/stand.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StandPolygonEditor } from "@/components/maps/stand-polygon-editor";
import { StandMiniMap } from "@/components/maps/stand-mini-map";
import type { GeoPoint } from "@/types/database.types";

interface StandMapSectionProps {
  standId: string;
  standGeoPolygon: GeoPoint[] | null;
  hallGeoPolygon: GeoPoint[] | null;
}

export function StandMapSection({
  standId,
  standGeoPolygon,
  hallGeoPolygon,
}: StandMapSectionProps) {
  const [editing, setEditing] = useState(false);
  const [polygon, setPolygon] = useState<GeoPoint[]>(standGeoPolygon ?? []);
  const [saving, setSaving] = useState(false);

  async function savePolygon() {
    if (polygon.length < 3) {
      toast.error("Draw at least 3 points for the stand shape");
      return;
    }
    setSaving(true);
    try {
      // Compute center for marker placement
      const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
      const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
      const { error } = await updateStand(standId, {
        geo_polygon: polygon as any,
        latitude: lat,
        longitude: lng,
      } as any);
      if (error) throw error;
      toast.success("Stand shape saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save stand shape");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="ios-card">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-headline">Stand Shape</CardTitle>
          <CardDescription>
            {editing ? "Draw the stand boundary" : "Map preview"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPolygon(standGeoPolygon ?? []);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={savePolygon} disabled={saving}>
                {saving ? "Saving..." : "Save Shape"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {standGeoPolygon ? "Edit Shape" : "Draw Shape"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <StandPolygonEditor
            hallPolygon={hallGeoPolygon}
            standPolygon={polygon.length >= 3 ? polygon : null}
            onChange={setPolygon}
          />
        ) : standGeoPolygon && standGeoPolygon.length >= 3 ? (
          <StandMiniMap
            standPolygon={standGeoPolygon}
            hallPolygon={hallGeoPolygon}
          />
        ) : (
          <p className="py-6 text-center text-caption-1 text-muted-foreground">
            No shape drawn yet. Click &quot;Draw Shape&quot; to define this stand&apos;s area.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
