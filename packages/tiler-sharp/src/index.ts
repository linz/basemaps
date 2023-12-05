import { ImageFormat } from '@basemaps/geo';
import {
  Composition,
  CompositionCotar,
  CompositionTiff,
  TileMaker,
  TileMakerContext,
  TileMakerResizeKernel,
} from '@basemaps/tiler';
import { Metrics } from '@linzjs/metrics';
import Sharp from 'sharp';
import { Decompressors } from './rgba.imagery.js';
import { ramp } from './color.ramp.js';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}
export type SharpOverlay = { input: string | Buffer } & Sharp.OverlayOptions;

function floatToImage(ret: { data: Buffer; info: Sharp.OutputInfo }): { data: Buffer; info: Sharp.OutputInfo } {
  const raw = new Uint8ClampedArray(ret.info.width * ret.info.height * 4);
  /** mapbox */
  const base = -10_000;
  const interval = 0.1;
  // console.log(ret.data, ret.data.length);
  for (let i = 0; i < ret.data.length; i += 4) {
    // const offset = i * 4;
    const offset = i;

    const px = ret.data.readFloatLE(i);
    // console.log(px);
    if (isNaN(px)) {
      // continue
      // px = 0;
      continue;
    }

    const v = (px - base) / interval;
    // console.log(v);
    raw[offset + 0] = Math.floor(v / 256 / 256) % 256;
    raw[offset + 1] = Math.floor(v / 256) % 256;
    raw[offset + 2] = v % 256;
    raw[offset + 3] = 255;
  }
  return { data: Buffer.from(raw), info: { ...ret.info, channels: 4 } };
}

function floatToImageRamp(ret: { data: Buffer; info: Sharp.OutputInfo }): { data: Buffer; info: Sharp.OutputInfo } {
  const raw = new Uint8ClampedArray(ret.info.width * ret.info.height * 4);
  // console.log(ret.data.length);

  // console.log(ret.data, ret.data.length);
  // const inputBuf = Float32Array.from(ret.data);
  // console.log(inputBuf);

  for (let i = 0; i < ret.data.length; i += 16) {
    // const offset = i * 4;
    const offset = i / 4;

    const alpha = ret.data.readFloatLE(i + 12);
    if (alpha < 5) continue;
    const px = ret.data.readFloatLE(i);
    // console.log(ret.data.slice(i + 12, i + 16), alpha);
    // console.log(px, alpha);

    // console.log(px);
    const color = ramp.get(px);

    raw[offset + 0] = color[0];
    raw[offset + 1] = color[1];
    raw[offset + 2] = color[2];
    raw[offset + 3] = color[3];
  }
  return { data: Buffer.from(raw), info: { ...ret.info, channels: 4 } };
}

const EmptyImage = new Map<string, Promise<Buffer>>();
export class TileMakerSharp implements TileMaker {
  static readonly MaxImageSize = 256 * 2 ** 15;
  private width: number;
  private height: number;

  public constructor(width: number, height = width) {
    this.width = width;
    this.height = height;
  }

  protected isTooLarge(composition: Composition): boolean {
    if (composition.type === 'cotar') return false;
    if (composition.resize) {
      if (composition.resize.width >= TileMakerSharp.MaxImageSize) {
        return true;
      }
      if (composition.resize.height >= TileMakerSharp.MaxImageSize) {
        return true;
      }
    }

    return false;
  }

  /** Get a empty (transparent for formats that support it) image buffer */
  private getEmptyImage(format: ImageFormat, background: Sharp.RGBA): Promise<Buffer> {
    const imgKey = [format, background.r, background.g, background.b, background.alpha].join('-');
    let existing = EmptyImage.get(imgKey);
    if (existing) return existing;
    existing = this.toImage(format, this.createImage(background));
    if (EmptyImage.size > 128) EmptyImage.clear(); // Drop cache if it gets too big
    EmptyImage.set(imgKey, existing);
    return existing;
  }

  /**
   * Convert the image to the correct output format then output it into a buffer
   * @param format output image format
   * @param pieline Image pipeline to convert
   *
   * @throws if unsupported image format is used
   * @returns image as the supplied image format
   */
  toImage(format: ImageFormat, pipeline: Sharp.Sharp): Promise<Buffer> {
    switch (format) {
      case ImageFormat.Jpeg:
        return pipeline.jpeg().toBuffer();
      case ImageFormat.Png:
        return pipeline.png().toBuffer();
      case ImageFormat.Webp:
        return pipeline.webp({ lossless: true }).toBuffer();
      case ImageFormat.Avif:
        return pipeline.avif().toBuffer();
      default:
        throw new Error(`Invalid image format "${format}"`);
    }
  }

  private async getImageBuffer(layers: SharpOverlay[], format: ImageFormat, background: Sharp.RGBA): Promise<Buffer> {
    if (layers.length === 0) return this.getEmptyImage(format, background);
    return this.toImage(format, this.createImage(background).composite(layers));
  }

  /** Can we just serve the image directly from the cotar */
  private isDirectCotar(ctx: TileMakerContext): boolean {
    if (ctx.layers.length !== 1) return false;
    const firstLayer = ctx.layers[0];
    if (firstLayer.type !== 'cotar') return false;
    if (this.width !== 256 || this.height !== 256) return false; // TODO this should not be hard coded
    if (ctx.format !== ImageFormat.Webp) return false; // TODO this should not be hard coded
    if (ctx.background.alpha !== 0) return false;
    return true;
  }

  /** Are we just serving the source tile directly back to the user without any modifications */
  private isDirectImage(ctx: TileMakerContext): boolean {
    if (ctx.layers.length !== 1) return false;
    const firstLayer = ctx.layers[0];
    if (firstLayer.type !== 'tiff') return false;
    // Has to be rendered at the top left with no modification
    if (firstLayer.x !== 0 || firstLayer.y !== 0) return false;
    if (firstLayer.crop != null || firstLayer.extract != null || firstLayer.resize != null) return false;

    // Validate tile size is expected
    const img = firstLayer.asset.getImage(firstLayer.source.imageId);
    const tileSize = img.tileSize;
    if (tileSize.height !== this.height || tileSize.width !== this.width) return false;

    // Image format has to match
    if (!img.compression?.includes(ctx.format)) return false;
    // Only transparent backgrounds can be served
    if (ctx.background.alpha !== 0) return false;

    return true;
  }

  public async compose(ctx: TileMakerContext): Promise<{ buffer: Buffer; metrics: Metrics; layers: number }> {
    const metrics = ctx.metrics ?? new Metrics();
    // TODO to prevent too many of these running, it should ideally be inside of a two step promise queue
    // 1. Load all image bytes
    // 2. Create image overlays
    metrics.start('compose:overlay');

    if (this.isDirectCotar(ctx)) {
      const firstLayer = ctx.layers[0] as CompositionCotar;
      const buf = await firstLayer.asset.get(firstLayer.path);
      if (buf == null) return { buffer: await this.getEmptyImage(ctx.format, ctx.background), metrics, layers: 0 };
      metrics.start('compose:direct');
      metrics.end('compose:direct');
      return { buffer: Buffer.from(buf), metrics, layers: 1 };
    }

    // If we are serving a single tile back to the user, sometimes we can serve the raw image buffer from the tiff
    if (this.isDirectImage(ctx)) {
      const firstLayer = ctx.layers[0] as CompositionTiff;
      const buf = await firstLayer.asset.getTile(firstLayer.source.x, firstLayer.source.y, firstLayer.source.imageId);
      metrics.end('compose:overlay');

      if (buf == null) return { buffer: await this.getEmptyImage(ctx.format, ctx.background), metrics, layers: 0 };
      // Track that a direct tiff was served to a user
      metrics.start('compose:direct');
      metrics.end('compose:direct');
      return { buffer: Buffer.from(buf.bytes), metrics, layers: 1 };
    }

    const todo: Promise<SharpOverlay | null>[] = [];
    for (const comp of ctx.layers) {
      if (this.isTooLarge(comp)) continue;
      todo.push(this.composeTile(comp, ctx.resizeKernel));
    }
    const overlays = await Promise.all(todo).then((items) => items.filter(notEmpty));
    metrics.end('compose:overlay');

    metrics.start('compose:compress');
    const buffer = await this.getImageBuffer(overlays, ctx.format, ctx.background);
    metrics.end('compose:compress');

    return { buffer, metrics, layers: overlays.length };
  }

  private async composeTile(comp: Composition, resizeKernel: TileMakerResizeKernel): Promise<SharpOverlay | null> {
    if (comp.type === 'tiff') return this.composeTileTiff(comp, resizeKernel);
    if (comp.type === 'cotar') return this.composeTileTar(comp);
    throw new Error('Failed to compose tile from source');
  }

  private async composeTileTar(comp: CompositionCotar): Promise<SharpOverlay | null> {
    const buf = await comp.asset.get(comp.path);
    if (buf == null) return null;
    return { input: Buffer.from(buf), top: 0, left: 0 };
  }

  async composeTileTiff(comp: CompositionTiff, resizeKernel: TileMakerResizeKernel): Promise<SharpOverlay | null> {
    const tile = await comp.asset.getTile(comp.source.x, comp.source.y, comp.source.imageId);
    if (tile == null) return null;

    const dec = Decompressors[tile.mimeType];
    if (dec == null) throw new Error('Unable to decompress: ' + tile.mimeType);

    const sharp = await dec.bytes(tile.bytes);

    // Extract the vars to make it easier to reference later
    const { extract, resize, crop } = comp;

    if (extract) sharp.extract({ top: 0, left: 0, width: extract.width, height: extract.height });

    if (resize) {
      const resizeOptions = { fit: Sharp.fit.cover, kernel: 'cubic' as const }; //  resize.scaleX > 1 ? resizeKernel.in : resizeKernel.out };
      sharp.resize(resize.width, resize.height, resizeOptions);
    }

    if (crop) sharp.extract({ top: crop.y, left: crop.x, width: crop.width, height: crop.height });

    if (dec.type === 'application/lerc') {
      const ret = await sharp.raw({ depth: 'float' }).toBuffer({ resolveWithObject: true });
      console.log(ret.data.length, ret.data.length / 4, ret.info);
      // console.log(ret);
      const f2i = floatToImageRamp(ret);
      // console.log(f2i, f2i.data.length);
      return {
        input: f2i.data,
        top: comp.y,
        left: comp.x,
        raw: { width: f2i.info.width, height: f2i.info.height, channels: f2i.info.channels },
      };
    }
    const ret = await sharp.raw().toBuffer({ resolveWithObject: true });
    return {
      input: ret.data,
      top: comp.y,
      left: comp.x,
      raw: { width: ret.info.width, height: ret.info.height, channels: ret.info.channels },
    };
  }

  /** Create a empty base image to be used with the output composition */
  createImage(background: Sharp.RGBA): Sharp.Sharp {
    return Sharp({
      create: {
        width: this.width,
        height: this.height,
        channels: 4,
        background,
      },
    });
  }
}
