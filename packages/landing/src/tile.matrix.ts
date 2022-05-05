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
 * One of the tileMatrix or targetTileMatrix has to be GoogleTms
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
  const wmTile = targetTileMatrix.tileToSource(tile);
  const [lon, lat] = Projection.get(targetTileMatrix).toWgs84([wmTile.x, wmTile.y]);
  return { lon: Math.round(lon * 1e8) / 1e8, lat: Math.round(lat * 1e8) / 1e8, zoom: location.zoom };
}

/** Re project WGS84 coordinates into the target tile matrix for use within maplibre */
export function projectToGoogle(location: [number, number], targetTileMatrix: TileMatrixSet): [number, number] {
  const projLocation = Projection.get(targetTileMatrix).fromWgs84(location);

  const projSource = targetTileMatrix.sourceToPixels(projLocation[0], projLocation[1], targetTileMatrix.maxZoom);
  const projTile = {
    x: projSource.x / targetTileMatrix.tileSize,
    y: projSource.y / targetTileMatrix.tileSize,
    z: targetTileMatrix.maxZoom,
  };
  const wmTile = GoogleTms.tileToSource(projTile);
  return Projection.get(GoogleTms).toWgs84([wmTile.x, wmTile.y]) as [number, number];
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
        const output = projectToGoogle(coord as [number, number], targetTileMatrix);
        coord[0] = output[0];
        coord[1] = output[1];
      }
    }
  }
}
