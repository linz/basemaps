import { ConfigImageryTiff } from '@basemaps/config/src/json/tiff.config';
import { BoundingBox, Bounds, EpsgCode, QuadKey, Simplify, TileId, TileMatrixSet } from '@basemaps/geo';
import { LogType, Projection } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/src/cli/info';
import { intersection, MultiPolygon, toFeatureCollection, union } from '@linzjs/geojson';
import { Metrics } from '@linzjs/metrics';
import { createCovering } from './cogify/covering.js';
import { CogifyDefaults } from './cogify/gdal.js';
import { CogifyLinkCutline, CogifyLinkSource, CogifyStacCollection, CogifyStacItem } from './cogify/stac.js';
import { CutlineOptimizer } from './cutline.js';

export interface TileCoverContext {
  id: string;
  imagery: ConfigImageryTiff;
  cutline: CutlineOptimizer;
  tileMatrix: TileMatrixSet;
  metrics?: Metrics;
  logger?: LogType;
}
export interface TileCoverResult {
  /** Stac collection for the imagery */
  collection: CogifyStacCollection;
  /** tiles to create */
  items: CogifyStacItem[];
  /** GeoJSON features of all the source imagery */
  source: GeoJSON.FeatureCollection;
}

export async function createTileCover(ctx: TileCoverContext): Promise<TileCoverResult> {
  // Find the zoom level that is at least as good as the source imagery
  const targetBaseZoom = Projection.getTiffResZoom(ctx.tileMatrix, ctx.imagery.gsd);
  const targetPixelScale = ctx.tileMatrix.pixelScale(targetBaseZoom);

  // The base zoom is 256x256 pixels at its resolution, we are trying to find a image that is <32k pixels wide/high
  // zooming out 7 levels converts a 256x256 image into 32k x 32k image
  // 256 * 2 ** 7 = 32,768 - 256x256 tile
  // 512 * 2 ** 6 = 32,768 - 512x512 tile
  const optimalCoveringZoom = targetBaseZoom - 7; // z12 from z19
  ctx.logger?.debug({ targetBaseZoom, cogOverZoom: optimalCoveringZoom }, 'Imagery:ZoomLevel');

  const sourceBounds = projectPolygon(
    polygonFromBounds(ctx.imagery.files),
    ctx.imagery.projection,
    ctx.tileMatrix.projection.code,
  );
  ctx.logger?.debug('Cutline:Apply');
  ctx.metrics?.start('cutline:apply');
  // Reduce the complexity of the cutline applied polygon to same as one pixel
  const cutBounds = Simplify.multiPolygon(ctx.cutline.cut(sourceBounds), targetPixelScale);
  if (cutBounds == null) throw new Error('No tiles need creating');

  ctx.metrics?.end('cutline:apply');

  // Convert the source imagery to a geojson
  const sourceGeoJson = ctx.imagery.files.map((file) => {
    return Projection.get(ctx.imagery.projection).boundsToGeoJsonFeature(file, { url: file.name });
  });
  ctx.logger?.info({ zoom: optimalCoveringZoom }, 'Imagery:Covering:Start');

  // Cover the source imagery in tiles
  ctx.metrics?.start('covering:create');
  const covering = createCovering({
    tileMatrix: ctx.tileMatrix,
    source: cutBounds,
    targetZoom: optimalCoveringZoom,
  });
  ctx.metrics?.end('covering:create');

  if (covering.size === 0) throw new Error('Unable to create tile covering, no tiles created.');
  ctx.logger?.info({ tiles: covering.size, zoom: optimalCoveringZoom }, 'Imagery:Covering:Created');

  const imageryBounds = ctx.imagery.files.map((f) => {
    const polygon = Bounds.fromJson(f).toPolygon();
    return { ...f, polygon };
  });

  ctx.metrics?.start('covering:polygon');
  const items = [...covering.values()].map((quadKey) => {
    const tile = QuadKey.toTile(quadKey);
    const bounds = ctx.tileMatrix.tileToSourceBounds(tile);

    // Scale the tile bounds slightly to ensure we get all relevant imagery
    const scaledBounds = bounds.scaleFromCenter(1.05);
    const tileBounds = Projection.get(ctx.tileMatrix).projectMultipolygon(
      [scaledBounds.toPolygon()],
      Projection.get(ctx.imagery.projection),
    ) as MultiPolygon;

    const source = imageryBounds.filter((f) => intersection(tileBounds, f.polygon).length > 0);

    const feature = Projection.get(ctx.tileMatrix).boundsToGeoJsonFeature(bounds);
    feature.geometry.coordinates;

    const tileId = TileId.toTileId(tile);

    const item: CogifyStacItem = {
      id: `${ctx.id}/${tileId}`,
      type: 'Feature',
      collection: ctx.id,
      stac_version: '1.0.0',
      stac_extensions: [],
      geometry: {
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates,
      } as any, // FIXME
      links: [{ href: `./${tileId}.json`, rel: 'self' }],
      properties: {
        'proj:epsg': ctx.tileMatrix.projection.code,
        'linz_basemaps:options': {
          tile,
          tileMatrix: ctx.tileMatrix.identifier,
          sourceEpsg: ctx.imagery.projection,
          blockSize: CogifyDefaults.blockSize,
          compression: CogifyDefaults.compression,
          quality: CogifyDefaults.quality,
          zoomLevel: targetBaseZoom,
          warpResampling: CogifyDefaults.warpResampling,
          overviewResampling: CogifyDefaults.overviewResampling,
        },
        'linz_basemaps:generated': {
          package: CliInfo.package,
          hash: CliInfo.hash,
          version: CliInfo.version,
          date: new Date().toISOString(),
        },
      },
      assets: {},
    };

    for (const src of source) {
      const srcLink: CogifyLinkSource = {
        href: src.name,
        rel: 'linz_basemaps:source',
        type: 'image/tiff; application=geotiff;',
      };
      item.links.push(srcLink);
    }

    // Add the cutline in if it exists
    if (ctx.cutline.path) {
      const cutLink: CogifyLinkCutline = {
        href: ctx.cutline.path,
        rel: 'linz_basemaps:cutline',
        blend: ctx.cutline.blend,
      };
      item.links.push(cutLink);
    }

    return item;
  }) as CogifyStacItem[];
  ctx.metrics?.end('covering:polygon');

  const collection: CogifyStacCollection = {
    id: ctx.id,
    type: 'Collection',
    stac_version: '1.0.0',
    stac_extensions: [],
    license: 'CC-BY-4.0',
    extent: {
      temporal: { interval: [['', '']] },
      spatial: { bbox: [] } as any, // FIXME
    },
    title: ctx.imagery.title,
    description: '',
    links: items.map((item) => {
      const tileId = TileId.toTileId(item.properties['linz_basemaps:options'].tile);
      return { href: `./${tileId}.json`, rel: 'item', type: 'application/json' };
    }),
  };

  // Add a self link to the links
  collection.links.unshift({ rel: 'self', href: './collection.json', type: 'application/json' });

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
