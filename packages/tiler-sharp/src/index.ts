import Sharp from 'sharp';
import {
  TileMaker,
  TileMakerContext,
  Composition,
  TileMakerResizeKernel,
  CompositionTiff,
  CompositionCotar,
} from '@basemaps/tiler';
import { Metrics } from '@linzjs/metrics';
import sharp from 'sharp';
import { ImageFormat } from '@basemaps/geo';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}
export type SharpOverlay = { input: string | Buffer } & Sharp.OverlayOptions;

const EmptyImage = new Map<string, Promise<Buffer>>();

export class TileMakerSharp implements TileMaker {
  static readonly MaxImageSize = 256 * 2 ** 15;
  private tileSize: number;

  public constructor(tileSize: number) {
    this.tileSize = tileSize;
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

  private toImage(format: ImageFormat, pipeline: sharp.Sharp): Promise<Buffer> {
    switch (format) {
      case ImageFormat.Jpeg:
        return pipeline.jpeg().toBuffer();
      case ImageFormat.Png:
        return pipeline.png().toBuffer();
      case ImageFormat.Webp:
        return pipeline.webp().toBuffer();
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
    if (this.tileSize !== 256) return false; // TODO this should not be hard coded
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
    if (tileSize.height !== this.tileSize || tileSize.width !== this.tileSize) return false;

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

  private async composeTileTiff(
    comp: CompositionTiff,
    resizeKernel: TileMakerResizeKernel,
  ): Promise<SharpOverlay | null> {
    const tile = await comp.asset.getTile(comp.source.x, comp.source.y, comp.source.imageId);
    if (tile == null) return null;

    const sharp = Sharp(Buffer.from(tile.bytes));

    // Extract the vars to make it easier to reference later
    const { extract, resize, crop } = comp;

    if (extract) sharp.extract({ top: 0, left: 0, width: extract.width, height: extract.height });

    if (resize) {
      const resizeOptions = { fit: Sharp.fit.cover, kernel: resize.scaleX > 1 ? resizeKernel.in : resizeKernel.out };
      sharp.resize(resize.width, resize.height, resizeOptions);
    }

    if (crop) sharp.extract({ top: crop.y, left: crop.x, width: crop.width, height: crop.height });

    return { input: await sharp.toBuffer(), top: comp.y, left: comp.x };
  }

  private createImage(background: Sharp.RGBA): Sharp.Sharp {
    return Sharp({
      create: {
        width: this.tileSize,
        height: this.tileSize,
        channels: 4,
        background,
      },
    });
  }
}
