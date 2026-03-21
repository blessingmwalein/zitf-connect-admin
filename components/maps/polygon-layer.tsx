"use client";

import { Polygon, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

interface PolygonLayerProps {
  positions: LatLngExpression[];
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function PolygonLayer({
  positions,
  color = "#007AFF",
  fillColor = "#007AFF",
  fillOpacity = 0.2,
  weight = 2,
  onClick,
  children,
}: PolygonLayerProps) {
  if (!positions || positions.length < 3) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{ color, fillColor, fillOpacity, weight }}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      {children && <Popup>{children}</Popup>}
    </Polygon>
  );
}
