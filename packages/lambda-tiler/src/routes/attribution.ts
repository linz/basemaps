import {
    AttributionCollection,
    AttributionItem,
    AttributionStac,
    Bounds,
    Stac,
    StacCollection,
    StacExtent,
} from '@basemaps/geo';
import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import {
    Aws,
    extractYearRangeFromName,
    FileOperator,
    NamedBounds,
    Projection,
    setNameAndProjection,
    tileAttributionFromPath,
    TileMetadataNamedTag,
    titleizeImageryName,
} from '@basemaps/shared';
import { BBox, MultiPolygon, multiPolygonToWgs84, Pair, union, Wgs84 } from '@linzjs/geojson';
import { TileSet } from '../tile.set';
import { loadTileSet } from '../tile.set.cache';

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

async function readStac(uri: string): Promise<StacCollection | null> {
    try {
        return await FileOperator.readJson<StacCollection>(uri);
    } catch (err) {
        if (FileOperator.isCompositeError(err) && err.code < 500) {
            return null;
        }
        throw err;
    }
}

/** Attempt to find the GSD from a stack summary object */
function getGsd(un?: Record<string, unknown>): number | null {
    if (un == null) return null;
    const gsd = un['gsd'];
    if (gsd == null) return null;
    if (!Array.isArray(gsd)) return null;
    if (isNaN(gsd[0])) return null;
    return gsd[0];
}

/**
 * Build a Single File STAC for the given TileSet.
 *
 * For now this is the minimal set required for attribution. This can be embellished later with
 * links and assets for a more comprehensive STAC file.
 */
async function tileSetAttribution(tileSet: TileSet): Promise<AttributionStac | null> {
    const proj = Projection.get(tileSet.tileMatrix.projection.code);
    const stacFiles = new Map<string, Promise<StacCollection | null>>();
    const cols: AttributionCollection[] = [];
    const items: AttributionItem[] = [];

    // read all stac files in parallel
    for (const rule of tileSet.tileSet.rules) {
        const im = tileSet.imagery.get(rule.imgId);
        if (im == null) continue;
        if (stacFiles.get(im.uri) == null) {
            stacFiles.set(im.uri, readStac(FileOperator.join(im.uri, 'collection.json')));
        }
    }

    const host = await Aws.tileMetadata.Provider.get(TileMetadataNamedTag.Production);
    if (host == null) return null;

    for (const rule of tileSet.tileSet.rules) {
        const im = tileSet.imagery.get(rule.imgId);
        if (im == null) continue;
        const stac = await stacFiles.get(im.uri);

        const bbox = proj.boundsToWgs84BoundingBox(im.bounds).map(roundNumber) as BBox;

        let interval: [string, string][] | undefined = stac?.extent.temporal.interval;
        if (interval == null) {
            const years = extractYearRangeFromName(im.name);
            if (years[0] === -1) {
                throw new Error('Missing date in imagery name: ' + im.name);
            }
            interval = [years.map((y) => `${y}-01-01T00:00:00Z`) as [string, string]];
        }
        const extent: StacExtent = { spatial: { bbox: [bbox] }, temporal: { interval } };

        items.push({
            type: 'Feature',
            stac_version: Stac.Version,
            id: rule.ruleId + '_item',
            collection: rule.ruleId,
            assets: {},
            links: [],
            bbox,
            geometry: {
                type: 'MultiPolygon',
                coordinates: createCoordinates(bbox, im.files, proj),
            },
            properties: {
                datetime: null,
                start_datetime: interval[0][0],
                end_datetime: interval[0][1],
            },
        });

        cols.push({
            stac_version: Stac.Version,
            license: stac?.license ?? Stac.License,
            id: rule.ruleId,
            providers: stac?.providers ?? [
                { name: host.serviceProvider.name, url: host.serviceProvider.site, roles: ['host'] },
            ],
            title: stac?.title ?? titleizeImageryName(im.name),
            description: stac?.description ?? 'No description',
            extent,
            links: [],
            summaries: {
                gsd: [getGsd(stac?.summaries) ?? im.resolution / 1000],
                'linz:zoom': { min: rule.minZoom, max: rule.maxZoom },
                'linz:priority': [rule.priority],
            },
        });
    }
    return {
        id: tileSet.id,
        type: 'FeatureCollection',
        stac_version: Stac.Version,
        stac_extensions: ['single-file-stac'],
        title: tileSet.title,
        description: tileSet.description,
        features: items,
        collections: cols,
        links: [],
    };
}

/**
 * Create a LambdaHttpResponse for a attribution request
 */
export async function attribution(req: LambdaContext): Promise<LambdaHttpResponse> {
    const data = tileAttributionFromPath(req.action.rest);
    if (data == null) return NotFound;
    setNameAndProjection(req, data);

    req.timer.start('tileset:load');
    const tileSet = await loadTileSet(data.name, data.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSet == null) return NotFound;

    const cacheKey = `v1.${tileSet.tileSet.version}`; // change version if format changes

    const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
        req.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
        return new LambdaHttpResponse(304, 'Not modified');
    }

    req.timer.start('stac:load');
    const attributions = await tileSetAttribution(tileSet);
    req.timer.end('stac:load');

    if (attributions == null) return NotFound;

    const response = new LambdaHttpResponse(200, 'ok');

    response.header(HttpHeader.ETag, cacheKey);
    // Keep fresh for one day; otherwise use cache but refresh cache for next time
    response.header(HttpHeader.CacheControl, 'public, max-age=86400, stale-while-revalidate=604800');

    response.json(attributions);

    return response;
}
