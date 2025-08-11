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

import { Decompressors } from './pipeline/decompressor.lerc.js';
import { cropResize } from './pipeline/pipeline.resize.js';
import { Pipelines } from './pipeline/pipelines.js';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}
export type SharpOverlay = { input: string | Buffer } & Sharp.OverlayOptions;

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
  toImage(format: ImageFormat, pipeline: Sharp.Sharp, lossless?: boolean): Promise<Buffer> {
    switch (format) {
      case 'jpeg':
        if (lossless) throw new Error('lossless jpeg is not defined');
        return pipeline.jpeg().toBuffer();
      case 'png':
        return pipeline.png().toBuffer();
      case 'webp':
        if (lossless) return pipeline.webp({ lossless: true, quality: 100, alphaQuality: 100 }).toBuffer();
        return pipeline.webp().toBuffer();
      case 'avif':
        if (lossless) throw new Error('lossless avif is not defined');
        return pipeline.avif().toBuffer();
      default:
        throw new Error(`Invalid image format`);
    }
  }

  private async getImageBuffer(
    layers: SharpOverlay[],
    format: ImageFormat,
    background: Sharp.RGBA,
    lossless?: boolean,
  ): Promise<Buffer> {
    if (layers.length === 0) return this.getEmptyImage(format, background);
    return this.toImage(format, this.createImage(background).composite(layers), lossless);
  }

  public async compose(ctx: TileMakerContext): Promise<{ buffer: Buffer; metrics: Metrics; layers: number }> {
    const metrics = ctx.metrics ?? new Metrics();
    // TODO to prevent too many of these running, it should ideally be inside of a two step promise queue
    // 1. Load all image bytes
    // 2. Create image overlays
    metrics.start('compose:overlay');

    const todo: Promise<SharpOverlay | null>[] = [];
    for (const comp of ctx.layers) {
      if (this.isTooLarge(comp)) continue;
      if (ctx.pipeline) {
        if (comp.type === 'cotar') throw new Error('Cannot use a composition pipeline from cotar');
        todo.push(this.composeTilePipeline(comp, ctx));
      } else {
        todo.push(this.composeTile(comp, ctx.resizeKernel));
      }
    }
    const overlays = await Promise.all(todo).then((items) => items.filter(notEmpty));
    metrics.end('compose:overlay');

    metrics.start('compose:compress');
    const buffer = await this.getImageBuffer(overlays, ctx.format, ctx.background, ctx.lossless);
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
    const tile = await comp.asset.images[comp.source.imageId].getTile(comp.source.x, comp.source.y);
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

    const ret = await sharp.raw().toBuffer({ resolveWithObject: true });
    return {
      input: ret.data,
      top: comp.y,
      left: comp.x,
      raw: { width: ret.info.width, height: ret.info.height, channels: ret.info.channels },
    };
  }

  async composeTilePipeline(comp: CompositionTiff, ctx: TileMakerContext): Promise<SharpOverlay | null> {
    const tile = await comp.asset.images[comp.source.imageId].getTile(comp.source.x, comp.source.y);
    if (tile == null) return null;
    const tiffTile = { imageId: comp.source.imageId, x: comp.source.x, y: comp.source.y };
    const bytes = await Decompressors[tile.compression]?.bytes(comp.asset, tiffTile, tile.bytes);
    if (bytes == null) throw new Error(`Failed to decompress: ${comp.asset.source.url.href}`);

    let result = bytes;
    if (ctx.pipeline) {
      const resizePerf = performance.now();
      // console.log(comp);
      result = cropResize(comp.asset, result, comp, 'bilinear');
      ctx.log?.trace(
        {
          pipeline: 'resize',
          source: comp.asset.source.url,
          isCrop: comp.crop != null,
          isResize: comp.resize != null,
          isExtract: comp.extract != null,
          tiffTile,
          duration: performance.now() - resizePerf,
        },
        'pipeline:resize',
      );

      for (const pipe of ctx.pipeline) {
        const pipelineStart = performance.now();
        result = await Pipelines[pipe.type]?.process(comp, result, pipe);
        ctx.log?.trace(
          {
            pipeline: pipe.type,
            source: comp.asset.source.url,
            tiffTile,
            duration: performance.now() - pipelineStart,
          },
          'pipeline:' + pipe.type,
        );

        if (result == null) throw new Error(`Failed to process pipeline:${pipe.type} on ${comp.asset.source.url.href}`);
      }
    }

    if (result.depth !== 'uint8') throw new Error('Expected RGBA image output');

    return {
      input: Buffer.from(result.pixels),
      top: comp.y,
      left: comp.x,
      raw: { width: result.width, height: result.height, channels: result.channels as 1 },
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
