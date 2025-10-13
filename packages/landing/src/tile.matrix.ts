import { GoogleTms, locationTransform, TileMatrixSet } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';

import { Config } from './config.js';
import { MapOptionType, WindowUrl } from './url.js';

export interface TileGridStyle {
  layerId: string;
  style?: string | null;
  config?: string | null;
  terrain?: string | null;
  labels?: boolean | null;
  pipeline?: string | null;
  imageFormat?: string | null;
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
    pipeline: cfg.pipeline ?? Config.map.pipeline,
    imageFormat: cfg.imageFormat ?? Config.map.imageFormat,
  });
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
