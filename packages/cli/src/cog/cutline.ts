import { Bounds, Epsg, NamedBounds, Tile, TileMatrixSet } from '@basemaps/geo';
import { compareName, fsa, Projection } from '@basemaps/shared';
import {
  clipMultipolygon,
  featuresToMultiPolygon,
  intersection,
  MultiPolygon,
  toFeatureCollection,
  toFeatureMultiPolygon,
  union,
} from '@linzjs/geojson';
import { FeatureCollection } from 'geojson';
import { CoveringFraction, MaxImagePixelWidth } from './constants.js';
import { CogJob, FeatureCollectionWithCrs, SourceMetadata } from './types.js';

/** Padding to always apply to image boundies */
const PixelPadding = 100;

/** fraction to scale source imagery to avoid degenerate edges */
const SourceSmoothScale = 1 + 1e-8;

function findGeoJsonProjection(geojson: any | null): Epsg {
  return Epsg.parse(geojson?.crs?.properties?.name ?? '') ?? Epsg.Wgs84;
}

function namedBounds(tms: TileMatrixSet, tile: Tile): NamedBounds {
  return { name: TileMatrixSet.tileToName(tile), ...tms.tileToSourceBounds(tile).toJson() };
}

export function polyContainsBounds(poly: MultiPolygon, bounds: Bounds): boolean {
  const clipped = clipMultipolygon(poly, bounds.toBbox());
  if (clipped.length !== 1 || clipped[0].length !== 1 || clipped[0][0].length !== 5) return false;

  return Bounds.fromMultiPolygon(clipped).containsBounds(bounds);
}

/**
 * Filter out duplicate tiles
 */
function addNonDupes(list: Tile[], addList: Tile[]): void {
  const len = list.length;
  for (const add of addList) {
    let i = 0;
    for (; i < len; ++i) {
      const curr = list[i];
      if (curr.x === add.x && curr.y === add.y && curr.z === add.z) {
        break;
      }
    }
    if (i === len) {
      list.push(add);
    }
  }
}

export class Cutline {
  /** The polygon to clip source imagery to */
  clipPoly: MultiPolygon;
  tileMatrix: TileMatrixSet; // convience to targetPtms.tms
  /** How much blending to apply at the clip line boundary */
  blend: number;
  /** For just one cog to cover the imagery */
  oneCogCovering: boolean;
  /** the polygon outlining a area covered by the source imagery and clip polygon */
  srcPoly: MultiPolygon = [];

  /**
     * Create a Cutline instance from a `GeoJSON FeatureCollection`.

     * @param tileMatrix the tileMatrix the COGs will be created in.

     * @param clipPoly the optional cutline. The source imagery outline used by default. This
     * `FeatureCollection` is converted to one `MultiPolygon` with any holes removed and the
     * coordinates transposed from `Wgs84` to the target projection (unless already in target projection).

     * @param blend How much blending to consider when working out boundaries.
     */
  constructor(tileMatrix: TileMatrixSet, clipPoly?: FeatureCollection, blend = 0, oneCogCovering = false) {
    this.tileMatrix = tileMatrix;
    this.blend = blend;
    this.oneCogCovering = oneCogCovering;
    if (clipPoly == null) {
      this.clipPoly = [];
      return;
    }

    this.tileMatrix = tileMatrix;

    const proj = findGeoJsonProjection(clipPoly);
    const tmsProj = Projection.get(tileMatrix);

    const needProj = proj !== tmsProj.epsg;

    if (needProj && proj !== Epsg.Wgs84) throw new Error('Invalid geojson; CRS may not be set for cutline!');
    const convert = needProj ? tmsProj.fromWgs84 : undefined;

    this.clipPoly = featuresToMultiPolygon(clipPoly.features, true, convert).coordinates as MultiPolygon;
  }

  /**
   * Load a geojson cutline from the file-system.
   *
   * @param path the path of the cutline to load. Can be `s3://` or local file path.
   */
  static loadCutline(path: string): Promise<FeatureCollection> {
    return fsa.readJson<FeatureCollection>(path);
  }

  /**
   * For the given tile `name`, filter `job.source.files` and cutline polygons that are within bounds plus
   * padding
   *
   * @param name
   * @param job
   * @returns names of source files required to render Cog
   */
  filterSourcesForName(name: string, job: CogJob): string[] {
    if (this.oneCogCovering) return job.source.files.map(({ name }) => name);
    const tile = TileMatrixSet.nameToTile(name);
    const sourceCode = Projection.get(job.source.epsg);
    const targetCode = Projection.get(this.tileMatrix);
    const tileBounds = this.tileMatrix.tileToSourceBounds(tile);
    const tilePadded = this.padBounds(tileBounds, job.targetZoom);

    let tileBoundsInSrcProj = tilePadded;

    if (sourceCode !== targetCode) {
      // convert the padded quadKey to source projection ensuring fully enclosed
      const poly = targetCode.projectMultipolygon([tileBoundsInSrcProj.toPolygon()], sourceCode);
      tileBoundsInSrcProj = Bounds.fromMultiPolygon(poly);
    }

    const paddedBbox = tilePadded.toBbox();
    if (this.clipPoly.length > 0) {
      const poly = clipMultipolygon(this.clipPoly, paddedBbox);
      if (poly.length === 0) {
        // this tile is not needed
        this.clipPoly = [];
        return [];
      } else if (polyContainsBounds(poly, tileBounds)) {
        // tile is completely surrounded; no cutline polygons needed
        this.clipPoly = [];
      } else {
        // set the cutline polygons to just the area of interest (minus degenerate edges)
        this.clipPoly = poly;
      }
    }

    return job.source.files
      .filter((image) => tileBoundsInSrcProj.intersects(Bounds.fromJson(image)))
      .map(({ name }) => name);
  }

  /**
   * Generate an optimized WebMercator tile cover for the supplied source images
   * @param sourceMetadata contains images bounds and projection info
   */
  optimizeCovering(sourceMetadata: SourceMetadata, maxImageSize: number = MaxImagePixelWidth): NamedBounds[] {
    if (this.oneCogCovering) {
      const extent = this.tileMatrix.extent.toJson();
      return [{ ...extent, name: '0-0-0' }];
    }
    this.findCovering(sourceMetadata);

    const { resZoom } = sourceMetadata;

    // Look for the biggest tile size we are allowed to create.
    let minZ = resZoom - 1;
    while (
      minZ > 0 &&
      Projection.getImagePixelWidth(this.tileMatrix, { x: 0, y: 0, z: minZ }, resZoom) < maxImageSize
    ) {
      --minZ;
    }
    minZ = Math.max(1, minZ + 1);

    let tiles: Tile[] = [];

    for (const tile of this.tileMatrix.topLevelTiles()) {
      // Don't make COGs with a tile.z < minZ.
      tiles = tiles.concat(this.makeTiles(tile, this.srcPoly, minZ, CoveringFraction).tiles);
    }

    if (tiles.length === 0) {
      throw new Error('Source imagery does not overlap with project extent');
    }

    const covering = tiles.map((tile) => namedBounds(this.tileMatrix, tile));
    // remove duplicate
    return covering
      .filter((curr) => {
        for (const other of covering) {
          if (other !== curr && Bounds.contains(other, curr)) return false;
        }
        return true;
      })
      .sort(compareName);
  }

  /**
   * Convert JobCutline to geojson FeatureCollection
   */
  toGeoJson(clipPoly = this.clipPoly): FeatureCollectionWithCrs {
    const feature = toFeatureCollection([toFeatureMultiPolygon(clipPoly)]) as FeatureCollectionWithCrs;
    feature.crs = {
      type: 'name',
      properties: { name: this.tileMatrix.projection.toUrn() },
    };
    return feature;
  }

  /**
   * Merge child nodes that have at least a covering fraction
   * @param tile the tile to descend
   * @param srcArea the aread of interest
   * @param minZ Only produce tiles for zoom levels at least `minZ` and no sibling tiles
   * greater than `minZ +2`
   * @param coveringFraction merge tiles that cover at least this fraction
   * @return the tiles and fraction covered of the tile by this srcArea
   */
  private makeTiles(
    tile: Tile,
    srcArea: MultiPolygon,
    minZ: number,
    coveringFraction: number,
  ): { tiles: Tile[]; fractionCovered: number } {
    const clipBounds = this.tileMatrix.tileToSourceBounds(tile).toBbox();

    srcArea = clipMultipolygon(srcArea, clipBounds);

    if (srcArea.length === 0) {
      return { tiles: [], fractionCovered: 0 };
    }

    if (tile.z === minZ + 4) {
      return { tiles: [tile], fractionCovered: 1 };
    }

    const ans = { tiles: [] as Tile[], fractionCovered: 0 };

    for (const child of this.tileMatrix.coverTile(tile)) {
      const { tiles, fractionCovered } = this.makeTiles(child, srcArea, minZ, coveringFraction);
      if (fractionCovered !== 0) {
        ans.fractionCovered += fractionCovered * 0.25;
        addNonDupes(ans.tiles, tiles);
      }
    }

    if (
      // tile too small OR children have enough coverage
      (tile.z > minZ + 2 || ans.fractionCovered >= coveringFraction) &&
      // AND more than one child tile
      ans.tiles.length > 1 &&
      // AND tile not too big
      tile.z >= minZ
    ) {
      ans.tiles = [tile]; // replace children with parent
    }

    return ans;
  }

  /**
     * Find the polygon covering of source imagery and a (optional) clip cutline. Truncates the
     * cutline to match.

     * @param sourceMetadata
     */
  private findCovering(sourceMetadata: SourceMetadata): void {
    let srcPoly: MultiPolygon = [];
    const { resZoom } = sourceMetadata;

    // merge imagery bounds
    for (const image of sourceMetadata.bounds) {
      const poly = [Bounds.fromJson(image).scaleFromCenter(SourceSmoothScale).toPolygon()] as MultiPolygon;
      srcPoly = union(srcPoly, poly);
    }

    // Convert polygon to target projection
    const sourceProj = Projection.get(sourceMetadata.projection);
    const targetProj = Projection.get(this.tileMatrix);
    if (sourceProj !== targetProj) {
      srcPoly = sourceProj.projectMultipolygon(srcPoly, targetProj) as MultiPolygon;
    }
    this.srcPoly = srcPoly;

    if (this.clipPoly.length === 0) return;

    const srcBounds = Bounds.fromMultiPolygon(srcPoly);
    const boundsPadded = this.padBounds(srcBounds, resZoom).toBbox();

    const poly = clipMultipolygon(this.clipPoly, boundsPadded);
    if (poly.length === 0) {
      throw new Error('No intersection between source imagery and cutline');
    }
    if (polyContainsBounds(poly, srcBounds)) {
      // tile is completely surrounded; no cutline polygons needed
      this.clipPoly = [];
    } else {
      // set the cutline polygons to just the area of interest (minus degenerate edges)
      this.clipPoly = poly;
      this.srcPoly = intersection(srcPoly, this.clipPoly) ?? [];
    }
  }

  /**
     * Pad the bounds to take in to consideration blending and 100 pixels of adjacent image data

     * @param bounds
     * @param resZoom the imagery resolution target zoom level
     */
  private padBounds(bounds: Bounds, resZoom: number): Bounds {
    const px = this.tileMatrix.pixelScale(resZoom);

    // Ensure cutline blend does not interferre with non-costal edges
    const widthScale = (bounds.width + px * (PixelPadding + this.blend) * 2) / bounds.width;
    const heightScale = (bounds.height + px * (PixelPadding + this.blend) * 2) / bounds.height;
    return bounds.scaleFromCenter(widthScale, heightScale);
  }
}
