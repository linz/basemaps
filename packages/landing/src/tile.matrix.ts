import { GoogleTms, Projection, TileMatrixSet } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';

import { Config } from './config.js';
import { MapLocation, MapOptionType, WindowUrl } from './url.js';

export interface TileGridStyle {
  layerId: string;
  style?: string | null;
  config?: string | null;
  terrain?: string | null;
  labels?: boolean | null;
}

export function getTileGridStyle(tileMatrixSet: TileMatrixSet, cfg: TileGridStyle): string {
  return WindowUrl.toTileUrl({
    urlType: MapOptionType.Style,
    tileMatrix: tileMatrixSet,
    layerId: cfg.layerId,
    style: cfg.style,
    config: cfg.config ?? Config.map.config,
    terrain: cfg.terrain ?? Config.map.terrain,
    labels: cfg.labels ?? Config.map.labels,
  });
}

function isGoogle(tms: TileMatrixSet): boolean {
  return tms.identifier === GoogleTms.identifier;
}
/**
 * Transform the location coordinate between maplibre and another tileMatrix.
 *
 * One of the tileMatrix or targetTileMatrix has to be GoogleTms
 */
export function locationTransform(
  location: MapLocation,
  tileMatrix: TileMatrixSet,
  targetTileMatrix: TileMatrixSet,
): MapLocation {
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
 * Covert map Bounds to tileMatrix BBox
 */
export function mapToBoundingBox(map: maplibregl.Map, zoom: number, tileMatrix: TileMatrixSet): BBox {
  const bounds = map.getBounds();
  const swLocation = { lon: bounds.getWest(), lat: bounds.getSouth(), zoom: zoom };
  const neLocation = { lon: bounds.getEast(), lat: bounds.getNorth(), zoom: zoom };
  const swCoord = locationTransform(swLocation, GoogleTms, tileMatrix);
  const neCoord = locationTransform(neLocation, GoogleTms, tileMatrix);
  // Truncate all coordiantes to 8 DP (~1mm)
  const bbox: BBox = [
    Math.round(swCoord.lon * 1e8) / 1e8,
    Math.round(swCoord.lat * 1e8) / 1e8,
    Math.round(neCoord.lon * 1e8) / 1e8,
    Math.round(neCoord.lat * 1e8) / 1e8,
  ];
  return bbox;
}

/**
 * Project a geojson object into the target tile matrix with use with maplibre
 *
 * *Warning* This will overwrite the existing object
 */
export function projectGeoJson(g: GeoJSON.FeatureCollection | GeoJSON.Feature, targetTileMatrix: TileMatrixSet): void {
  if (g.type === 'FeatureCollection') {
    for (const f of g.features) {
      projectFeature(f, targetTileMatrix);
    }
  } else if (g.type === 'Feature') {
    projectFeature(g, targetTileMatrix);
  }
}

function projectFeature(f: GeoJSON.Feature, targetTileMatrix: TileMatrixSet): void {
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
  } else {
    throw new Error(`Geometry feature type: ${f.geometry.type} not supported`);
  }
}
