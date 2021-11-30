import Sharp from 'sharp';
import { TileMaker, ImageFormat, TileMakerContext, Composition, TileMakerResizeKernel } from '@basemaps/tiler';
import { Metrics } from '@linzjs/metrics';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}
export type SharpOverlay = { input: string | Buffer } & Sharp.OverlayOptions;

const EmptyImage = new Map<ImageFormat, Promise<Buffer>>();

export class TileMakerSharp implements TileMaker {
  static readonly MaxImageSize = 256 * 2 ** 15;
  private tileSize: number;

  public constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  protected isTooLarge(composition: Composition): boolean {
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
  private getEmptyImage(format: ImageFormat): Promise<Buffer> {
    let existing = EmptyImage.get(format);
    if (existing) return existing;
    existing = this.getImageBuffer([], format, { r: 0, g: 0, b: 0, alpha: 0 });
    EmptyImage.set(format, existing);
    return existing;
  }

  private async getImageBuffer(layers: SharpOverlay[], format: ImageFormat, background: Sharp.RGBA): Promise<Buffer> {
    let pipeline = this.createImage(background);
    if (layers.length > 0) pipeline = pipeline.composite(layers);
    switch (format) {
      case ImageFormat.JPEG:
        return pipeline.jpeg().toBuffer();
      case ImageFormat.PNG:
        return pipeline.png().toBuffer();
      case ImageFormat.WEBP:
        return pipeline.webp().toBuffer();
      case ImageFormat.AVIF:
        return pipeline.avif().toBuffer();
      default:
        throw new Error(`Invalid image format "${format}"`);
    }
  }

  /** Are we just serving the source tile directly back to the user without any modifications */
  private isDirectImage(ctx: TileMakerContext): boolean {
    if (ctx.layers.length !== 1) return false;
    const firstLayer = ctx.layers[0];
    // Has to be rendered at the top left with no modification
    if (firstLayer.x !== 0 || firstLayer.y !== 0) return false;
    if (firstLayer.crop != null || firstLayer.extract != null || firstLayer.resize != null) return false;

    // Validate tile size is expected
    const img = firstLayer.tiff.getImage(firstLayer.source.imageId);
    const tileSize = img.tileSize;
    if (tileSize.height !== this.tileSize || tileSize.width !== this.tileSize) return false;

    // Image format has to match
    if (!img.compression?.includes(ctx.format)) return false;
    // Only transparent backgrounds can be served
    if (ctx.background.alpha !== 0) return false;

    return true;
  }

  public async compose(ctx: TileMakerContext): Promise<{ buffer: Buffer; metrics: Metrics; layers: number }> {
    const metrics = new Metrics();
    // TODO to prevent too many of these running, it should ideally be inside of a two step promise queue
    // 1. Load all image bytes
    // 2. Create image overlays
    metrics.start('compose:overlay');

    // If we are serving a single tile back to the user, sometimes we can serve the raw image buffer from the tiff
    if (this.isDirectImage(ctx)) {
      const firstLayer = ctx.layers[0];
      const buf = await firstLayer.tiff.getTile(firstLayer.source.x, firstLayer.source.y, firstLayer.source.imageId);
      metrics.end('compose:overlay');

      if (buf == null) return { buffer: await this.getEmptyImage(ctx.format), metrics, layers: 0 };
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

  private async composeTile(
    composition: Composition,
    resizeKernel: TileMakerResizeKernel,
  ): Promise<SharpOverlay | null> {
    const source = composition.source;
    const tile = await composition.tiff.getTile(source.x, source.y, source.imageId);
    if (tile == null) return null;
    const sharp = Sharp(Buffer.from(tile.bytes));

    // The stats function takes too long to run, its faster to just compose all the tiles anyway.
    // const stats = await sharp.stats();
    // const [red, green, blue] = stats.channels;
    // // If there is no color this tile is not really worth doing anything with
    // if (red.max === 0 && green.max === 0 && blue.max === 0) {
    //     // TODO this could be made to be much more smart in terms of excluding images from the rendering
    //     // If there is no area which has alpha then we may not need to compose all the tiles
    //     // so we could cut the rendering pipeline down
    //     return null;
    // }

    if (composition.extract) {
      sharp.extract({ top: 0, left: 0, width: composition.extract.width, height: composition.extract.height });
    }

    if (composition.resize) {
      const resizeOptions: Sharp.ResizeOptions = {
        fit: Sharp.fit.cover,
        kernel: composition.resize.scale > 1 ? resizeKernel.in : resizeKernel.out,
      };
      sharp.resize(composition.resize.width, composition.resize.height, resizeOptions);
    }

    if (composition.crop) {
      sharp.extract({
        top: composition.crop.y,
        left: composition.crop.x,
        width: composition.crop.width,
        height: composition.crop.height,
      });
    }

    const input = await sharp.toBuffer();
    return {
      input,
      top: composition.y,
      left: composition.x,
    };
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
