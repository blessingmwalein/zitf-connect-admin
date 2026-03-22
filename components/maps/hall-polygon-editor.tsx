"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/database.types";
import { MapSkeleton } from "./map-skeleton";

const HallPolygonEditorInner = dynamic(
  () => import("./hall-polygon-editor-inner").then((m) => m.HallPolygonEditorInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[300px] md:h-[400px] lg:h-[500px]" /> }
);

interface HallPolygonEditorProps {
  polygon?: GeoPoint[] | null;
  onChange: (coords: GeoPoint[]) => void;
}

export function HallPolygonEditor({ polygon, onChange }: HallPolygonEditorProps) {
  return <HallPolygonEditorInner polygon={polygon} onChange={onChange} />;
}
