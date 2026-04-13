import "leaflet";

declare module "leaflet" {
  export type HeatLatLngTuple = [number, number, number];

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): Layer;
}
