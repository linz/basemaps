import { Rgba } from '@basemaps/config';
import { ConfigImageryTiff } from '@basemaps/config-loader';
import { BoundingBox, Bounds, EpsgCode, Projection, ProjectionLoader, TileId, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType, urlToString } from '@basemaps/shared';
import { CliDate, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { intersection, MultiPolygon, toFeatureCollection, union } from '@linzjs/geojson';
import { Metrics } from '@linzjs/metrics';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson.js';

import { Presets } from '../../preset.js';
import { CogifyLinkCutline, CogifyLinkSource, CogifyStacCollection, CogifyStacItem, createFileStats } from '../stac.js';
import { createCovering } from './covering.js';
import { CutlineOptimizer } from './cutline.js';

export interface TileCoverContext {
  /** Unique id for the covering */
  id: string;
  /** List of imagery to cover */
  imagery: ConfigImageryTiff;
  /** Cutline to apply */
  cutline: CutlineOptimizer;
  /** Output tile matrix */
  tileMatrix: TileMatrixSet;
  /** Optional metrics provider to track how long actions take */
  metrics?: Metrics;
  /** Optional logger to trace covering creation */
  logger?: LogType;
  /** GDAL configuration preset */
  preset: string;
  /** Optional color with which to replace all transparent COG pixels */
  background?: Rgba;
  /**
   * Override the base zoom to store the output COGS as
   */
  targetZoomOffset?: number;
}
export interface TileCoverResult {
  /** Stac collection for the imagery */
  collection: CogifyStacCollection;
  /** tiles to create */
  items: CogifyStacItem[];
  /** GeoJSON features of all the source imagery */
  source: GeoJSON.FeatureCollection;
}

function getDateTime(ctx: TileCoverContext): { start: string | null; end: string | null } {
  const interval = ctx.imagery.collection?.extent?.temporal?.interval?.[0];

  if (interval) return { start: interval[0], end: interval[1] };

  // TODO should we guess datetime
  return { start: null, end: null };
}

/**
 * Find a zoom level in the target tile matrix that is at least as good as resolution as `resolution`
 *
 * for some imagery sets this can mean a large difference in the source to target for example 1M resolution source imagery
 * is resampled to 0.59m (z18) rather than the closer 1.19m (z17) `targetZoomOffset` can adjust the resolution
 * to a nearer value using `-1` will convert a 1M target from 0.59m (z18) to 1.19m (z17)
 *
 * This can greatly reduce the size of output tiles
 *
 * @param tileMatrix target tile tile matrix to use
 * @param resolution target resolution
 * @param targetZoomOffset override the target base zoom, for instance -1 turns a z18 into z17
 * @returns
 */
function getTargetBaseZoom(tileMatrix: TileMatrixSet, resolution: number, targetZoomOffset?: number): number {
  if (targetZoomOffset == null) return Projection.getTiffResZoom(tileMatrix, resolution);
  return Projection.getTiffResZoom(tileMatrix, resolution) + targetZoomOffset;
}

export async function createTileCover(ctx: TileCoverContext): Promise<TileCoverResult> {
  // Ensure we have the projection loaded for the source imagery
  await ProjectionLoader.load(ctx.imagery.projection);

  // Find the zoom level that is at least as good as the source imagery
  const targetBaseZoom = getTargetBaseZoom(ctx.tileMatrix, ctx.imagery.gsd, ctx.targetZoomOffset);

  // The base zoom is 256x256 pixels at its resolution, we are trying to find a image that is <32k pixels wide/high
  // zooming out 7 levels converts a 256x256 image into 32k x 32k image
  // 256 * 2 ** 7 = 32,768 - 256x256 tile
  // 512 * 2 ** 6 = 32,768 - 512x512 tile
  const optimalCoveringZoom = Math.max(1, targetBaseZoom - 7); // z12 from z19
  ctx.logger?.debug({ targetBaseZoom, cogOverZoom: optimalCoveringZoom }, 'Imagery:ZoomLevel');

  const sourceBounds = projectPolygon(
    polygonFromBounds(ctx.imagery.files),
    ctx.imagery.projection,
    ctx.tileMatrix.projection.code,
  );
  ctx.logger?.debug('Cutline:Apply');
  ctx.metrics?.start('cutline:apply');

  const dateTime = getDateTime(ctx);

  // Convert the source imagery to a geojson
  const sourceGeoJson = ctx.imagery.files.map((file) => {
    return Projection.get(ctx.imagery.projection).boundsToGeoJsonFeature(file, { url: file.name });
  });
  ctx.logger?.info({ zoom: optimalCoveringZoom }, 'Imagery:Covering:Start');

  // Cover the source imagery in tiles
  ctx.metrics?.start('covering:create');
  const covering = createCovering({
    tileMatrix: ctx.tileMatrix,
    source: sourceBounds,
    targetZoom: optimalCoveringZoom,
    baseZoom: targetBaseZoom,
    cutline: ctx.cutline,
    metrics: ctx.metrics,
    logger: ctx.logger,
  });
  ctx.metrics?.end('covering:create');

  if (covering.length === 0) throw new Error('Unable to create tile covering, no tiles created.');
  ctx.logger?.info({ tiles: covering.length, zoom: optimalCoveringZoom }, 'Imagery:Covering:Created');

  const imageryBounds = ctx.imagery.files.map((f) => {
    const polygon = Bounds.fromJson(f).toPolygon();
    return { ...f, polygon };
  });

  ctx.metrics?.start('covering:polygon');
  const items: CogifyStacItem[] = [];
  for (const tile of covering) {
    const bounds = ctx.tileMatrix.tileToSourceBounds(tile);

    // Scale the tile bounds slightly to ensure we get all relevant imagery
    const scaledBounds = bounds.scaleFromCenter(1.05);
    const tileBounds = Projection.get(ctx.tileMatrix).projectMultipolygon(
      [scaledBounds.toPolygon()],
      Projection.get(ctx.imagery.projection),
    ) as MultiPolygon;

    const source = imageryBounds.filter((f) => intersection(tileBounds, f.polygon).length > 0);

    const feature = Projection.get(ctx.tileMatrix).boundsToGeoJsonFeature(bounds);

    const tileId = TileId.fromTile(tile);

    const item: CogifyStacItem = {
      id: `${ctx.id}/${tileId}`,
      type: 'Feature',
      collection: ctx.id,
      stac_version: '1.0.0',
      stac_extensions: [],
      geometry: feature.geometry as GeoJSONPolygon,
      bbox: Projection.get(ctx.tileMatrix).boundsToWgs84BoundingBox(bounds),
      links: [
        { href: `./${tileId}.json`, rel: 'self' },
        { href: './collection.json', rel: 'collection' },
        { href: './collection.json', rel: 'parent' },
      ],
      properties: {
        datetime: dateTime.start ? null : CliDate,
        start_datetime: dateTime.start ?? undefined,
        end_datetime: dateTime.end ?? undefined,
        'proj:epsg': ctx.tileMatrix.projection.code,
        'linz_basemaps:options': {
          preset: ctx.preset,
          ...Presets[ctx.preset].options,
          tile,
          tileMatrix: ctx.tileMatrix.identifier,
          sourceEpsg: ctx.imagery.projection,
          zoomLevel: targetBaseZoom,
        },
        'linz_basemaps:generated': {
          package: CliInfo.package,
          hash: CliInfo.hash,
          version: CliInfo.version,
          datetime: CliDate,
        },
      },
      assets: {},
    };

    // Add the background color if it exists
    if (ctx.background) item.properties['linz_basemaps:options'].background = ctx.background;

    // Add the source imagery as a STAC Link
    for (const src of source) {
      const srcLink: CogifyLinkSource = {
        href: new URL(src.name, ctx.imagery.url).href,
        rel: 'linz_basemaps:source',
        type: 'image/tiff; application=geotiff;',
        'linz_basemaps:source_height': src.height,
        'linz_basemaps:source_width': src.width,
      };
      item.links.push(srcLink);
    }

    // Add the cutline as a STAC Link if it exists
    if (ctx.cutline.path) {
      const cutLink: CogifyLinkCutline = {
        href: urlToString(ctx.cutline.path),
        rel: 'linz_basemaps:cutline',
        blend: ctx.cutline.blend,
      };
      item.links.push(cutLink);
    }

    items.push(item);
  }
  ctx.metrics?.end('covering:polygon');

  const collection: CogifyStacCollection = {
    id: ctx.id,
    type: 'Collection',
    stac_version: '1.0.0',
    stac_extensions: [],
    license: ctx.imagery.collection?.license ?? 'CC-BY-4.0',
    title: ctx.imagery.title,
    description: ctx.imagery.collection?.description ?? 'Missing source STAC',
    providers: ctx.imagery.collection?.providers,
    extent: {
      spatial: { bbox: [Projection.get(ctx.imagery.projection).boundsToWgs84BoundingBox(ctx.imagery.bounds)] },
      // Default  the temporal time today if no times were found as it is required for STAC
      temporal: { interval: dateTime.start ? [[dateTime.start, dateTime.end]] : [[CliDate, null]] },
    },
    links: items.map((item) => {
      const tile = item.properties['linz_basemaps:options'].tile;
      if (tile == null) throw new Error('Tile missing from item');
      const tileId = TileId.fromTile(tile);
      return { href: `./${tileId}.json`, rel: 'item', type: 'application/json' };
    }),
  };

  // Add a self link to the links
  collection.links.unshift({ rel: 'self', href: './collection.json', type: 'application/json' });
  // Include a link back to the source collection
  if (ctx.imagery.collection) {
    const target = new URL('collection.json', ctx.imagery.url);
    const stac = await fsa.read(target);
    collection.links.push({
      rel: 'linz_basemaps:source_collection',
      href: target.href,
      type: 'application/json',
      ...createFileStats(stac),
    });
  }

  return { collection, items, source: toFeatureCollection(sourceGeoJson) };
}

/** Convert a list of bounding boxes into a multipolygon */
function polygonFromBounds(bounds: BoundingBox[], scale: number = 1 + 1e-8): MultiPolygon {
  const srcPoly: MultiPolygon = [];

  // merge imagery bounds
  for (const image of bounds) {
    srcPoly.push(Bounds.fromJson(image).scaleFromCenter(scale).toPolygon());
  }
  return union(srcPoly);
}

/** project a polygon from the source projection to a target projection  */
function projectPolygon(p: MultiPolygon, sourceProjection: EpsgCode, targetProjection: EpsgCode): MultiPolygon {
  if (sourceProjection === targetProjection) return p;
  const sourceProj = Projection.get(sourceProjection);
  const targetProj = Projection.get(targetProjection);
  return sourceProj.projectMultipolygon(p, targetProj) as MultiPolygon;
}
