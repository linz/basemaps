import { Nztm2000QuadTms, projectFeature, TileMatrixSet } from '@basemaps/geo';

// Transform a GeoJSON feature to the NZTM projection
export function transformNdJson(f: unknown): void {
  projectFeature(f as GeoJSON.Feature, Nztm2000QuadTms);
}

// Transform Zoom level to NZTM projection
export function transformZoom(z: number, tileMatrix: TileMatrixSet): number {
  if (tileMatrix.identifier !== Nztm2000QuadTms.identifier) return Math.max(0, z - 2);
  else return z;
}
