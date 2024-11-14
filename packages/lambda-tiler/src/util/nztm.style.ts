import { StyleJson } from '@basemaps/config';

/**
 * limited checking to cast a unknown paint/layout into one with stops
 */
function hasStops(x: unknown): x is { stops: [number, unknown][] } {
  if (x == null) return false;
  return Array.isArray((x as { stops: unknown })['stops']);
}

/**
 * Convert a style json from a WebMercatorQuad style into a NZTM2000Quad style,
 * This creates a clone of the source style and does not modify the source
 *
 * NZTM2000Quad is offset from WebMercatorQuad by two zoom levels
 *
 * @param inputStyle style to convert
 * @param clone Should the input style be cloned or modified
 * @returns a new style converted into NZTM2000Quad zooms
 */
export function convertStyleToNztmStyle(inputStyle: StyleJson, clone: boolean = true): StyleJson {
  const style = clone ? structuredClone(inputStyle) : inputStyle;

  for (const layer of style.layers) {
    // Adjust the min/max zoom
    if (layer.minzoom) layer.minzoom = Math.max(0, layer.minzoom - 2);
    if (layer.maxzoom) layer.maxzoom = Math.max(0, layer.maxzoom - 2);

    // Check all the pain and layout for "stops" then adjust the stops by two
    const stylesToCheck = [layer.paint, layer.layout];
    for (const obj of stylesToCheck) {
      if (obj == null) continue;
      for (const val of Object.values(obj)) {
        if (!hasStops(val)) continue;
        for (const stop of val.stops) stop[0] = Math.max(0, stop[0] - 2);
      }
    }
  }

  return style;
}
