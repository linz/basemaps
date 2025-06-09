import { Nztm2000QuadTms, projectFeature, TileMatrixSet } from '@basemaps/geo';
import { Feature } from 'geojson';

// Transform a GeoJSON feature to the NZTM projection
export function transformNdJson(feature: Feature): void {
  projectFeature(feature, Nztm2000QuadTms);
}

// Transform Zoom level to NZTM projection
export function transformZoom(z: number, tileMatrix: TileMatrixSet): number {
  if (tileMatrix.identifier !== Nztm2000QuadTms.identifier) return Math.max(0, z - 2);
  else return z;
}
