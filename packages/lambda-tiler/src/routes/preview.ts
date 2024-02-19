import { ConfigTileSetRaster, ConfigTileSetRasterOutput } from '@basemaps/config';
import { Bounds, LatLon, Projection, TileMatrixSet } from '@basemaps/geo';
import { CompositionTiff, TileMakerContext, Tiler } from '@basemaps/tiler';
import { SharpOverlay, TileMakerSharp } from '@basemaps/tiler-sharp';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import sharp from 'sharp';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';
import { DefaultBackground, DefaultResizeKernel, isArchiveTiff, TileXyzRaster } from './tile.xyz.raster.js';

export interface PreviewGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
    outputType?: string;
    lat: string;
    lon: string;
    z: string;
  };
}

const PreviewSize = { width: 1200, height: 630 };
const TilerSharp = new TileMakerSharp(PreviewSize.width, PreviewSize.height);

/** Slightly grey color for the checker background */
const PreviewBackgroundFillColor = 0xef;
/** Make th e checkered background 30x30px */
const PreviewBackgroundSizePx = 30;

/**
 * Serve a preview of a imagery set
 *
 * /v1/preview/:tileSet/:tileMatrixSet/:z/:lon/:lat
 * /v1/preview/:tileSet/:tileMatrixSet/:z/:lon/:lat/:outputType
 *
 * @example
 * Raster Tile `/v1/preview/aerial/WebMercatorQuad/12/177.3998405/-39.0852555`
 *
 */
export async function tilePreviewGet(req: LambdaHttpRequest<PreviewGet>): Promise<LambdaHttpResponse> {
  const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
  if (tileMatrix == null) return new LambdaHttpResponse(404, 'Tile Matrix not found');

  req.set('tileMatrix', tileMatrix.identifier);
  req.set('projection', tileMatrix.projection.code);

  // TODO we should detect the format based off the "Accept" header and maybe default back to webp
  const location = Validate.getLocation(req.params.lon, req.params.lat);
  if (location == null) return new LambdaHttpResponse(404, 'Preview location not found');
  req.set('location', location);

  const z = Math.ceil(parseFloat(req.params.z));
  if (isNaN(z) || z < 0 || z > tileMatrix.maxZoom) return new LambdaHttpResponse(404, 'Preview zoom invalid');

  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return new LambdaHttpResponse(404, 'Tileset not found');
  // Only raster previews are supported
  if (tileSet.type !== 'raster') return new LambdaHttpResponse(404, 'Preview invalid tile set type');

  const outputFormat = req.params.outputType ?? 'webp';

  const tileOutput = Validate.pipeline(tileSet, outputFormat, req.query.get('pipeline'));
  if (tileOutput == null) return new LambdaHttpResponse(404, `Output format: ${outputFormat} not found`);
  req.set('extension', tileOutput.output?.type);
  req.set('pipeline', tileOutput.name ?? 'rgba');

  return renderPreview(req, { tileSet, tileMatrix, location, output: tileOutput, z });
}

interface PreviewRenderContext {
  /** Imagery to use */
  tileSet: ConfigTileSetRaster;
  /** output tilematrix to use */
  tileMatrix: TileMatrixSet;
  /** Center point of the preview */
  location: LatLon;
  /** Image format to render the preview as */
  output: ConfigTileSetRasterOutput;
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

  const tileOutput = ctx.output;
  const tileContext: TileMakerContext = {
    layers: compositions,
    pipeline: tileOutput.pipeline,
    format: tileOutput.output?.type?.[0] ?? 'webp', // default to the first output format if defined or webp
    lossless: tileOutput.output?.lossless,
    background: tileOutput.output?.background ?? ctx.tileSet.background ?? DefaultBackground,
    resizeKernel: tileOutput.output?.resizeKernel ?? ctx.tileSet.resizeKernel ?? DefaultResizeKernel,
  };

  // Load all the tiff tiles and resize/them into the correct locations
  req.timer.start('compose:overlay');
  const overlays = (await Promise.all(
    compositions.map((comp) => TilerSharp.composeTilePipeline(comp, tileContext)),
  ).then((items) => items.filter((f) => f != null))) as SharpOverlay[];
  req.timer.end('compose:overlay');

  // Create the output image and render all the individual pieces into them
  const img = getBaseImage(ctx.tileSet.background);
  img.composite(overlays);

  req.timer.start('compose:compress');
  const buf = await TilerSharp.toImage(tileContext.format, img, tileContext.lossless);
  req.timer.end('compose:compress');

  req.set('layersUsed', overlays.length);
  req.set('bytes', buf.byteLength);
  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
  response.buffer(buf, 'image/' + tileContext.format);

  const shortLocation = [ctx.location.lon.toFixed(7), ctx.location.lat.toFixed(7)].join('_');
  const suggestedFileName = `preview_${ctx.tileSet.name}_z${ctx.z}_${shortLocation}-${ctx.output.name}.${tileContext.format}`;
  response.header('Content-Disposition', `inline; filename=\"${suggestedFileName}\"`);

  return response;
}

function getBaseImage(bg?: { r: number; g: number; b: number; alpha: number }): sharp.Sharp {
  if (bg == null || bg.alpha === 0) {
    const buf = createCheckerBoard({
      width: PreviewSize.width,
      height: PreviewSize.height,
      colors: { fill: PreviewBackgroundFillColor, background: 0xff },
      size: PreviewBackgroundSizePx,
    });
    return sharp(buf.buffer, { raw: buf.raw });
  }
  return TilerSharp.createImage(bg);
}

export interface CheckerBoard {
  /** Output image width in pixels */
  width: number;
  /** Output image height in pixels */
  height: number;
  colors: {
    /** Color of the checker board eg 0xef */
    fill: number;
    /** Color of the background eg 0xff */
    background: number;
  };
  /** Size of the checkers */
  size: number;
}

/** Create a chess/checkerboard background alternating between two colors */
function createCheckerBoard(ctx: CheckerBoard): {
  buffer: Buffer;
  raw: { width: number; height: number; channels: 1 };
} {
  const { width, height, size } = ctx;
  const fillColor = ctx.colors.fill;
  // Create a one band image, which starts off as full white
  const buf = Buffer.alloc(height * width, ctx.colors.background); // 1 band grey buffer;

  // Number of squares to make in x/y directions
  const tileY = height / size;
  const tileX = width / size;

  // Fill in a square at the x/y pixel offsets
  function fillSquare(xOffset: number, yOffset: number): void {
    for (let y = 0; y < size; y++) {
      const yPx = (yOffset + y) * width;
      for (let x = 0; x < size; x++) {
        const px = yPx + xOffset + x;
        // Actually set the color
        buf[px] = fillColor;
      }
    }
  }
  for (let tX = 0; tX < tileX; tX++) {
    for (let tY = 0; tY < tileY; tY++) {
      const yOffset = tY * size;
      const y2 = tY % 2;

      // Draw every second tile alternating on rows
      const x2 = tX % 2;
      if (x2 === 0 && y2 === 1) continue;
      if (x2 === 1 && y2 === 0) continue;

      const xOffset = tX * size;
      fillSquare(xOffset, yOffset);
    }
  }

  return { buffer: buf, raw: { width, height, channels: 1 } };
}
