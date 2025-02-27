import { Epsg, EpsgCode, Projection, Tile, TileMatrixSet } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import {
  Area,
  FeatureCollectionWithCrs,
  featuresToMultiPolygon,
  intersection,
  MultiPolygon,
  toFeatureCollection,
  toFeatureMultiPolygon,
} from '@linzjs/geojson';

import { CogifyLinkCutline } from '../stac.js';

export async function loadCutline(path: URL): Promise<{ polygon: MultiPolygon; projection: EpsgCode }> {
  const buf = await fsa.read(path);

  if (path.pathname.endsWith('.geojson') || path.pathname.endsWith('.json')) {
    const data = JSON.parse(buf.toString()) as FeatureCollectionWithCrs;
    const projection = Epsg.parseCode(data.crs?.properties?.name ?? '') ?? EpsgCode.Wgs84;
    const polygon = featuresToMultiPolygon(data.features, true).coordinates as MultiPolygon;
    return { polygon, projection };
  }

  throw new Error('Unknown cutline type: ' + path.href);
}

export class CutlineOptimizer {
  /** Pad tiles by 200m when optimizing cutlines so blending will not be affected */
  static TilePixelPadding = 200;
  path: URL | null;
  cutline: MultiPolygon | null;
  blend: number;
  tileMatrix: TileMatrixSet;

  constructor(path: URL | null, cutline: MultiPolygon | null, blend: number, tileMatrix: TileMatrixSet) {
    this.path = path;
    this.cutline = cutline;
    this.blend = blend;
    this.tileMatrix = tileMatrix;
  }

  /** Cut a polygon to the cutline */
  cut(poly: MultiPolygon): MultiPolygon {
    if (this.cutline == null) return poly;
    // TODO buffer the cutline by this.blend so blended tiles will be included
    // although it is somewhat wasteful to make a cog just for a blended cut
    return intersection(poly, this.cutline);
  }

  /** Optimize a cutline for a tile, if it doesn't intersect then ignore the cutline */
  optimize(tile: Tile): FeatureCollectionWithCrs | null {
    if (this.cutline == null) return null;
    const tileBounds = this.tileMatrix.tileToSourceBounds(tile);
    const tileScale = this.tileMatrix.pixelScale(tile.z);

    // Expand the tile bounds to ensure optimized bounds are not clipping and blended.
    const scaleAmount =
      (tileBounds.width + tileScale * (CutlineOptimizer.TilePixelPadding + this.blend) * 2) / tileBounds.width;

    const scaledBounds = tileBounds.scaleFromCenter(scaleAmount);

    const optimized = intersection(this.cutline, scaledBounds.toPolygon());

    // Check how much of a change was the optimized cutline
    const optimizedArea = Area.multiPolygon(optimized);
    const scaledArea = scaledBounds.width * scaledBounds.height;
    const areaPercent = 1 - optimizedArea / scaledArea;

    // if area is bigger than 0.0001% then assume the cutline was applied
    if (areaPercent < 1e-4) return null;

    const feature = toFeatureCollection([toFeatureMultiPolygon(optimized)]) as FeatureCollectionWithCrs;
    feature.crs = { type: 'name', properties: { name: this.tileMatrix.projection.toUrn() } };
    return feature;
  }

  /**
   * Convert cutline to geojson FeatureCollection
   *
   * @returns GeoJSON FeatureCollection if cutline exists, null otherwise
   */
  toGeoJson(): FeatureCollectionWithCrs | null {
    if (this.cutline == null) return null;
    const feature = toFeatureCollection([toFeatureMultiPolygon(this.cutline)]) as FeatureCollectionWithCrs;
    feature.crs = { type: 'name', properties: { name: this.tileMatrix.projection.toUrn() } };
    return feature;
  }

  static async load(path: URL | undefined, blend: number, tileMatrix: TileMatrixSet): Promise<CutlineOptimizer> {
    if (path == null) return new CutlineOptimizer(null, null, blend, tileMatrix);
    const cut = await loadCutline(path);

    if (cut.projection === tileMatrix.projection.code)
      return new CutlineOptimizer(path, cut.polygon, blend, tileMatrix);

    const projected = Projection.get(cut.projection).projectMultipolygon(
      cut.polygon,
      Projection.get(tileMatrix.projection),
    ) as MultiPolygon;

    return new CutlineOptimizer(path, projected, blend, tileMatrix);
  }

  /** Create a cutline optimizer from a STAC cutline link */
  static async loadFromLink(l: CogifyLinkCutline | null, tileMatrix: TileMatrixSet): Promise<CutlineOptimizer> {
    if (l == null) return new CutlineOptimizer(null, null, 0, tileMatrix);
    return this.load(new URL(l.href), l.blend, tileMatrix);
  }
}
