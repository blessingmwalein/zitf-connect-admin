"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/database.types";
import { MapSkeleton } from "./map-skeleton";

const StandPolygonEditorInner = dynamic(
  () => import("./stand-polygon-editor-inner").then((m) => m.StandPolygonEditorInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[300px]" /> }
);

interface StandPolygonEditorProps {
  hallPolygon?: GeoPoint[] | null;
  standPolygon?: GeoPoint[] | null;
  onChange: (coords: GeoPoint[]) => void;
}

export function StandPolygonEditor(props: StandPolygonEditorProps) {
  return <StandPolygonEditorInner {...props} />;
}
