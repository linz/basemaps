import { ConfigTileSet, TileSetType } from '@basemaps/config';
import {
  AttributionCollection,
  AttributionItem,
  AttributionStac,
  Bounds,
  GoogleTms,
  NamedBounds,
  Stac,
  StacExtent,
  TileMatrixSet,
} from '@basemaps/geo';
import { Config, extractYearRangeFromName, Projection, titleizeImageryName } from '@basemaps/shared';
import { BBox, MultiPolygon, multiPolygonToWgs84, Pair, union, Wgs84 } from '@linzjs/geojson';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { Etag } from '../util/etag.js';
import { Validate } from '../util/validate.js';

/** Amount to pad imagery bounds to avoid fragmenting polygons  */
const SmoothPadding = 1 + 1e-10; // about 1/100th of a millimeter at equator

const NotFound = new LambdaHttpResponse(404, 'Not Found');

const Precision = 10 ** 8;

/**
 * Limit precision to 8 decimal places.
 */
function roundNumber(n: number): number {
  return Math.round(n * Precision) / Precision;
}

function roundPair(p: Pair): Pair {
  return [roundNumber(p[0]), roundNumber(p[1])];
}

/**
 * Convert a list of COG file bounds into a MultiPolygon. If the bounds spans more than half the
 * globe then return a simple MultiPolygon for the bounding box.

 * @param bbox in WGS84
 * @param files in target projection
 * @return MultiPolygon in WGS84
 */
function createCoordinates(bbox: BBox, files: NamedBounds[], proj: Projection): MultiPolygon {
  if (Wgs84.delta(bbox[0], bbox[2]) <= 0) {
    // This bounds spans more than half the globe which multiPolygonToWgs84 can't handle; just
    // return bbox as polygon
    return Wgs84.bboxToMultiPolygon(bbox);
  }

  let coordinates: MultiPolygon = [];

  // merge imagery bounds
  for (const image of files) {
    const poly = [Bounds.fromJson(image).pad(SmoothPadding).toPolygon()] as MultiPolygon;
    coordinates = union(coordinates, poly);
  }

  const roundToWgs84 = (p: number[]): number[] => roundPair(proj.toWgs84(p) as Pair);

  return multiPolygonToWgs84(coordinates, roundToWgs84);
}

/**
 * Build a Single File STAC for the given TileSet.
 *
 * For now this is the minimal set required for attribution. This can be embellished later with
 * links and assets for a more comprehensive STAC file.
 */
async function tileSetAttribution(
  req: LambdaHttpRequest,
  tileSet: ConfigTileSet,
  tileMatrix: TileMatrixSet,
): Promise<AttributionStac | null> {
  const proj = Projection.get(tileMatrix);
  const cols: AttributionCollection[] = [];
  const items: AttributionItem[] = [];

  const imagery = await Config.getAllImagery(tileSet.layers, [tileMatrix.projection]);

  const host = await Config.Provider.get(Config.Provider.id('linz'));
  if (host == null) return null;

  for (const layer of tileSet.layers) {
    const imgId = layer[proj.epsg.code];
    if (imgId == null) continue;
    const im = imagery.get(imgId);
    if (im == null) continue;

    const bbox = proj.boundsToWgs84BoundingBox(im.bounds).map(roundNumber) as BBox;

    const years = extractYearRangeFromName(im.name);
    if (years[0] === -1) throw new Error('Missing date in imagery name: ' + im.name);
    const interval = [years.map((y) => `${y}-01-01T00:00:00Z`) as [string, string]];

    const extent: StacExtent = { spatial: { bbox: [bbox] }, temporal: { interval } };

    items.push({
      type: 'Feature',
      stac_version: Stac.Version,
      id: imgId + '_item',
      collection: imgId,
      assets: {},
      links: [],
      bbox,
      geometry: { type: 'MultiPolygon', coordinates: createCoordinates(bbox, im.files, proj) },
      properties: {
        title: im.title ?? titleizeImageryName(im.name),
        category: im.category,
        datetime: null,
        start_datetime: interval[0][0],
        end_datetime: interval[0][1],
      },
    });

    const zoomMin = TileMatrixSet.convertZoomLevel(layer.minZoom ? layer.minZoom : 0, GoogleTms, tileMatrix, true);
    const zoomMax = TileMatrixSet.convertZoomLevel(layer.maxZoom ? layer.maxZoom : 32, GoogleTms, tileMatrix, true);
    cols.push({
      stac_version: Stac.Version,
      license: Stac.License,
      id: im.id,
      providers: [{ name: host.serviceProvider.name, url: host.serviceProvider.site, roles: ['host'] }],
      title: im.title ?? titleizeImageryName(im.name),
      description: 'No description',
      extent,
      links: [],
      summaries: {
        'linz:category': im.category,
        'linz:zoom': { min: zoomMin, max: zoomMax },
        'linz:priority': [1000 + tileSet.layers.indexOf(layer)],
      },
    });
  }
  return {
    id: tileSet.id,
    type: 'FeatureCollection',
    stac_version: Stac.Version,
    stac_extensions: ['single-file-stac'],
    title: tileSet.title ?? 'No title',
    description: tileSet.description ?? 'No Description',
    features: items,
    collections: cols,
    links: [],
  };
}

export interface TileAttributionGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
  };
}

/**
 * Create a LambdaHttpResponse for a attribution request
 */
export async function tileAttributionGet(req: LambdaHttpRequest<TileAttributionGet>): Promise<LambdaHttpResponse> {
  const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
  if (tileMatrix == null) throw new LambdaHttpResponse(404, 'Tile Matrix not found');

  req.timer.start('tileset:load');
  const tileSet = await Config.TileSet.get(Config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null || tileSet.type === TileSetType.Vector) return NotFound;

  const cacheKey = Etag.key(JSON.stringify(tileSet));
  if (Etag.isNotModified(req, cacheKey)) return new LambdaHttpResponse(304, 'Not modified');

  req.timer.start('stac:load');
  const attributions = await tileSetAttribution(req, tileSet, tileMatrix);
  req.timer.end('stac:load');

  if (attributions == null) return NotFound;

  const response = new LambdaHttpResponse(200, 'ok');

  response.header(HttpHeader.ETag, cacheKey);
  // Keep fresh for 7 days; otherwise use cache but refresh cache for next time
  response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
  response.json(attributions);
  return response;
}
