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

/**
 * Transform the location coordinate between mapbox and another tileMatrix.
 * One of the tileMatrix or targetTileMatrix has to be MapboxTms(GoogleTms)
 */
export function locationTransform(
  location: MapLocation,
  tileMatrix: TileMatrixSet,
  targetTileMatrix: TileMatrixSet,
): MapLocation {
  if (tileMatrix.identifier === targetTileMatrix.identifier) return location;
  const projection = Projection.get(tileMatrix);
  const coords = projection.fromWgs84([location.lon, location.lat]);
  const center = tileMatrix.sourceToPixels(coords[0], coords[1], Math.round(location.zoom));
  const tile = { x: center.x / tileMatrix.tileSize, y: center.y / tileMatrix.tileSize, z: Math.round(location.zoom) };
  const mapboxTile = targetTileMatrix.tileToSource(tile);
  const [lon, lat] = Projection.get(targetTileMatrix).toWgs84([mapboxTile.x, mapboxTile.y]);
  return { lon: Math.round(lon * 1e8) / 1e8, lat: Math.round(lat * 1e8) / 1e8, zoom: location.zoom };
}
