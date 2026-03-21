"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import type { GeoPoint } from "@/types/database.types";

interface PolygonDrawControlProps {
  existingPolygon?: GeoPoint[] | null;
  onPolygonChange: (coords: GeoPoint[]) => void;
  drawColor?: string;
}

export function PolygonDrawControl({
  existingPolygon,
  onPolygonChange,
  drawColor = "#007AFF",
}: PolygonDrawControlProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const controlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Add existing polygon if present
    if (existingPolygon && existingPolygon.length >= 3) {
      const latlngs = existingPolygon.map(
        ([lat, lng]) => L.latLng(lat, lng)
      );
      const polygon = L.polygon(latlngs, {
        color: drawColor,
        fillColor: drawColor,
        fillOpacity: 0.2,
      });
      drawnItems.addLayer(polygon);
    }

    // Configure draw control - polygon only
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: drawColor,
            fillColor: drawColor,
            fillOpacity: 0.2,
          },
        } as any,
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    controlRef.current = drawControl;
    map.addControl(drawControl);

    // Handle polygon created
    const onCreated = (e: any) => {
      // Clear previous polygons — only allow one
      drawnItems.eachLayer((layer) => {
        if (layer !== e.layer) drawnItems.removeLayer(layer);
      });
      drawnItems.addLayer(e.layer);
      const latlngs = (e.layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
      onPolygonChange(latlngs.map((ll) => [ll.lat, ll.lng] as GeoPoint));
    };

    const onEdited = (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: any) => {
        const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
        onPolygonChange(latlngs.map((ll) => [ll.lat, ll.lng] as GeoPoint));
      });
    };

    const onDeleted = () => {
      onPolygonChange([]);
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
      if (controlRef.current) map.removeControl(controlRef.current);
      map.removeLayer(drawnItems);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}
