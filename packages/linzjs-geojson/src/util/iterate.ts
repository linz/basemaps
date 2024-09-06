/**
 * Iterate all the positions inside the features positions
 *
 * @throws if geometry is of unknown type
 *
 * @param feature Feature to iterate
 * @param cb call back to run on the position
 * @returns
 */
export function iterate(feature: GeoJSON.Feature, cb: (pt: [number, number]) => void): void {
  const geom = feature.geometry;
  if (geom.type === 'Point') return cb(geom.coordinates as [number, number]);
  if (geom.type === 'MultiPoint') return iteratePosition(geom.coordinates, cb);
  if (geom.type === 'Polygon') return iteratePosition2(geom.coordinates, cb);
  if (geom.type === 'MultiPolygon') return iteratePosition3(geom.coordinates, cb);
  if (geom.type === 'LineString') return iteratePosition(geom.coordinates, cb);
  if (geom.type === 'MultiLineString') return iteratePosition2(geom.coordinates, cb);

  throw new Error('Unknown geometry type ');
}

// Iteration functions for three levels of nested positions commonly used in geojson
function iteratePosition3(f: GeoJSON.Position[][][], cb: (pt: [number, number]) => void): void {
  for (const outer of f) {
    for (const poly of outer) {
      for (const pt of poly) cb(pt as [number, number]);
    }
  }
}

function iteratePosition2(f: GeoJSON.Position[][], cb: (pt: [number, number]) => void): void {
  for (const poly of f) {
    for (const pt of poly) cb(pt as [number, number]);
  }
}

function iteratePosition(f: GeoJSON.Position[], cb: (pt: [number, number]) => void): void {
  for (const pt of f) cb(pt as [number, number]);
}
