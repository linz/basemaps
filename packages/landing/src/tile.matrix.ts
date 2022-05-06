import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms, TileMatrixSet } from '@basemaps/geo';
import { Projection } from '@basemaps/shared/build/proj/projection.js';
import { Style } from 'maplibre-gl';
import { MapLocation, MapOptionType, WindowUrl } from './url.js';

export class TileGrid {
  tileMatrix: TileMatrixSet;
  extraZoomLevels: number;
  constructor(tileMatrix: TileMatrixSet, extraZoomLevels = 0) {
    this.tileMatrix = tileMatrix;
    this.extraZoomLevels = extraZoomLevels;
  }

  getStyle(layerId: string, style?: string | null): Style | string {
    if (layerId === 'topographic') {
      return WindowUrl.toTileUrl(MapOptionType.TileVectorStyle, this.tileMatrix, layerId, style);
    }
    return {
      version: 8,
      sources: {
        basemaps: {
          type: 'raster',
          tiles: [WindowUrl.toTileUrl(MapOptionType.TileRaster, this.tileMatrix, layerId)],
          tileSize: 256,
        },
      },
      layers: [{ id: 'LINZ Raster Basemaps', type: 'raster', source: 'basemaps' }],
    };
  }
}

const Nztm2000TileGrid = new TileGrid(Nztm2000Tms, 2);
const Nztm2000QuadTileGrid = new TileGrid(Nztm2000QuadTms);
const GoogleTileGrid = new TileGrid(GoogleTms);

const Grids = [Nztm2000TileGrid, Nztm2000QuadTileGrid, GoogleTileGrid];

export function getTileGrid(id: string): TileGrid {
  for (const g of Grids) {
    if (id === g.tileMatrix.identifier) return g;
  }
  return GoogleTileGrid;
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
 * Project a geojson object into the target tile matrix with use with maplibre
 *
 * *Warning* This will overwrite the existing object
 */
export function projectGeoJson(g: GeoJSON.FeatureCollection, targetTileMatrix: TileMatrixSet): void {
  for (const f of g.features) {
    if (f.geometry.type !== 'Polygon') throw new Error('Only polygons supported');

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
  }
}
