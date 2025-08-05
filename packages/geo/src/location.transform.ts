import { Feature, FeatureCollection } from 'geojson';

import { Projection } from './proj/projection.js';
import { TileMatrixSet } from './tile.matrix.set.js';
import { GoogleTms } from './tms/google.js';

function isGoogle(tms: TileMatrixSet): boolean {
  return tms.identifier === GoogleTms.identifier;
}
/**
 * Transform the location coordinate between maplibre and another tileMatrix.
 *
 * One of the tileMatrix or targetTileMatrix has to be GoogleTms
 */
export function locationTransform(
  location: { lat: number; lon: number; zoom: number },
  tileMatrix: TileMatrixSet,
  targetTileMatrix: TileMatrixSet,
): { lat: number; lon: number; zoom: number } {
  if (tileMatrix.identifier === targetTileMatrix.identifier) return location;
  if (!isGoogle(tileMatrix) && !isGoogle(targetTileMatrix)) {
    throw new Error('Either tileMatrix or targetTileMatrix must be GoogleTms');
  }
  // Transform the source to the the tile it would be rendered on
  const coords = Projection.get(tileMatrix).fromWgs84([location.lon, location.lat]);
  const point = tileMatrix.sourceToPixels(coords[0], coords[1], Math.round(location.zoom));

  const tile = { x: point.x / tileMatrix.tileSize, y: point.y / tileMatrix.tileSize, z: Math.round(location.zoom) };

  // Translate the tile location into the target tile matrix
  const source = targetTileMatrix.tileToSource(tile);
  const lonLat = Projection.get(targetTileMatrix).toWgs84([source.x, source.y]);

  return { lon: Math.round(lonLat[0] * 1e8) / 1e8, lat: Math.round(lonLat[1] * 1e8) / 1e8, zoom: location.zoom };
}

/**
 * Project a geojson object into the target tile matrix with use with maplibre
 *
 * *Warning* This will overwrite the existing object
 */
export function projectGeoJson(g: FeatureCollection | Feature, targetTileMatrix: TileMatrixSet): void {
  if (g.type === 'FeatureCollection') {
    for (const f of g.features) {
      projectFeature(f, targetTileMatrix);
    }
  } else if (g.type === 'Feature') {
    projectFeature(g, targetTileMatrix);
  }
}

export function projectFeature(f: Feature, targetTileMatrix: TileMatrixSet): void {
  if (f.geometry.type === 'Polygon') {
    for (const poly of f.geometry.coordinates) {
      for (const coord of poly) {
        const output = locationTransform(
          { lat: coord[1], lon: coord[0], zoom: targetTileMatrix.maxZoom },
          targetTileMatrix,
          GoogleTms,
        );
        coord[0] = output.lon;
        coord[1] = output.lat;
      }
    }
  } else if (f.geometry.type === 'MultiPolygon') {
    for (const multiPoly of f.geometry.coordinates) {
      for (const poly of multiPoly) {
        for (const coord of poly) {
          const output = locationTransform(
            { lat: coord[1], lon: coord[0], zoom: targetTileMatrix.maxZoom },
            targetTileMatrix,
            GoogleTms,
          );
          coord[0] = output.lon;
          coord[1] = output.lat;
        }
      }
    }
  } else if (f.geometry.type === 'Point') {
    const coord = f.geometry.coordinates;
    const output = locationTransform(
      { lat: coord[1], lon: coord[0], zoom: targetTileMatrix.maxZoom },
      targetTileMatrix,
      GoogleTms,
    );
    coord[0] = output.lon;
    coord[1] = output.lat;
  } else if (f.geometry.type === 'MultiLineString') {
    for (const line of f.geometry.coordinates) {
      for (const coord of line) {
        const output = locationTransform(
          { lat: coord[1], lon: coord[0], zoom: targetTileMatrix.maxZoom },
          targetTileMatrix,
          GoogleTms,
        );
        coord[0] = output.lon;
        coord[1] = output.lat;
      }
    }
  } else if (f.geometry.type === 'LineString') {
    for (const coord of f.geometry.coordinates) {
      const output = locationTransform(
        { lat: coord[1], lon: coord[0], zoom: targetTileMatrix.maxZoom },
        targetTileMatrix,
        GoogleTms,
      );
      coord[0] = output.lon;
      coord[1] = output.lat;
    }
  } else {
    throw new Error(`Geometry feature type: ${f.geometry.type} not supported`);
  }
}
