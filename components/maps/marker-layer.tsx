"use client";

import { Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  popupContent?: React.ReactNode;
}

interface MarkerLayerProps {
  markers: MapMarker[];
}

export function MarkerLayer({ markers }: MarkerLayerProps) {
  return (
    <>
      {markers.map((m, i) => (
        <Marker key={`${m.lat}-${m.lng}-${i}`} position={[m.lat, m.lng] as LatLngExpression}>
          <Popup>
            {m.popupContent ?? (
              <div>
                <p className="font-medium text-sm">{m.label}</p>
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
