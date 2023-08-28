import { ConfigTileSetRaster } from '@basemaps/config';
import { Bounds, ImageFormat, LatLon, Projection, TileMatrixSet, VectorFormat } from '@basemaps/geo';
import { CompositionTiff, Tiler } from '@basemaps/tiler';
import { SharpOverlay, TileMakerSharp } from '@basemaps/tiler-sharp';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';
import { DefaultBackground, DefaultResizeKernel, TileXyzRaster, isArchiveTiff } from './tile.xyz.raster.js';

export interface PreviewGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
    imageFormat: string;
    lat: string;
    lon: string;
    z: string;
  };
}

const PreviewSize = { width: 1200, height: 630 };

/**
 * Serve a preview of a imagery set
 *
 * /v1/preview/:tileSet/:tileMatrixSet/:z/:lon/:lat.:tileType
 *
 * @example
 * Raster Tile `/v1/preview/aerial/WebMercatorQuad/177.3998405/-39.0852555.webp`
 *
 */
export async function tilePreviewGet(req: LambdaHttpRequest<PreviewGet>): Promise<LambdaHttpResponse> {
  const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
  if (tileMatrix == null) throw new LambdaHttpResponse(404, 'Tile Matrix not found');

  req.set('tileMatrix', tileMatrix.identifier);
  req.set('projection', tileMatrix.projection.code);

  const outputFormat = Validate.getTileFormat(req.params.imageFormat);
  if (outputFormat == null) throw new LambdaHttpResponse(404, 'Preview extension not found');
  // Vector tile previews are not supported
  if (outputFormat === VectorFormat.MapboxVectorTiles) {
    throw new LambdaHttpResponse(404, 'Preview extension not supported');
  }
  req.set('extension', outputFormat);

  const location = Validate.getLocation(req.params.lon, req.params.lat);
  if (location == null) throw new LambdaHttpResponse(404, 'Preview location not found');
  req.set('location', location);

  const z = Math.round(parseFloat(req.params.z));
  if (isNaN(z) || z < 0 || z > tileMatrix.maxZoom) throw new LambdaHttpResponse(404, 'Preview zoom invalid');

  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();
  // Only raster previews are supported
  if (tileSet.type !== 'raster') throw new LambdaHttpResponse(404, 'Preview invalid tile set type');

  return renderPreview(req, { tileSet, tileMatrix, location, outputFormat, z });
}

interface PreviewRenderContext {
  /** Imagery to use */
  tileSet: ConfigTileSetRaster;
  /** output tilematrix to use */
  tileMatrix: TileMatrixSet;
  /** Center point of the preview */
  location: LatLon;
  /** Iamge format to render the preview as */
  outputFormat: ImageFormat;
  /** Zom level to be use, must be a integer */
  z: number;
}
/**
 * Render the preview!
 *
 * All the parameter validation is done in {@link tilePreviewGet} this function expects everything to align
 *
 * @returns 304 not modified if the ETag matches or 200 ok with the content of the image
 */
export async function renderPreview(req: LambdaHttpRequest, ctx: PreviewRenderContext): Promise<LambdaHttpResponse> {
  const tileMatrix = ctx.tileMatrix;
  // Convert the input lat/lon into the projected coordinates to make it easier to do math with
  const coords = Projection.get(tileMatrix).fromWgs84([ctx.location.lon, ctx.location.lat]);

  // use the input as the center point, but round it to the closest pixel to make it easier to do math
  const point = tileMatrix.sourceToPixels(coords[0], coords[1], ctx.z);
  const pointCenter = { x: Math.round(point.x), y: Math.round(point.y) };

  // position of the preview in relation to the output screen
  const screenBounds = new Bounds(
    pointCenter.x - PreviewSize.width / 2,
    pointCenter.y - PreviewSize.height / 2,
    PreviewSize.width,
    PreviewSize.height,
  );

  // Convert the screen bounds back into the source to find the assets we need to render the preview
  const topLeft = tileMatrix.pixelsToSource(screenBounds.x, screenBounds.y, ctx.z);
  const bottomRight = tileMatrix.pixelsToSource(screenBounds.right, screenBounds.bottom, ctx.z);
  const sourceBounds = Bounds.fromBbox([topLeft.x, topLeft.y, bottomRight.x, bottomRight.y]);

  const assetLocations = await TileXyzRaster.getAssetsForBounds(
    req,
    ctx.tileSet,
    tileMatrix,
    sourceBounds,
    ctx.z,
    true,
  );

  const cacheKey = Etag.key(assetLocations);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const assets = await TileXyzRaster.loadAssets(req, assetLocations);
  const tiler = new Tiler(tileMatrix);

  // Figure out what tiffs and tiles need to be read and where they are placed on the output image
  const compositions: CompositionTiff[] = [];
  for (const asset of assets) {
    // there shouldn't be any Cotar archives in previews but ignore them to be safe
    if (!isArchiveTiff(asset)) continue;
    const result = tiler.getTiles(asset, screenBounds, ctx.z);
    if (result == null) continue;
    compositions.push(...result);
  }

  const tilerSharp = new TileMakerSharp(PreviewSize.width, PreviewSize.height);
  // Load all the tiff tiles and resize/them into the correct locations
  req.timer.start('compose:overlay');
  const overlays = (await Promise.all(
    compositions.map((comp) => tilerSharp.composeTileTiff(comp, DefaultResizeKernel)),
  ).then((items) => items.filter((f) => f != null))) as SharpOverlay[];
  req.timer.end('compose:overlay');

  // Create the output image and render all the individual pieces into them
  const img = tilerSharp.createImage(DefaultBackground);
  img.composite(overlays);

  req.timer.start('compose:compress');
  const buf = await tilerSharp.toImage(ctx.outputFormat, img);
  req.timer.end('compose:compress');

  req.set('layersUsed', overlays.length);
  req.set('bytes', buf.byteLength);
  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
  response.buffer(buf, 'image/' + ctx.outputFormat);
  return response;
}
