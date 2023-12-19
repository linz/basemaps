import { ConfigComputeOutputFormat } from '@basemaps/config/build/config/compute/compute.function.js';
import { ConfigTileSetComputedOutput } from '@basemaps/config/build/config/tile.set.js';
import { Composition, CompositionTiff } from '@basemaps/tiler';
import { Compression } from '@cogeotiff/core';
import { Metrics } from '@linzjs/metrics';
import Sharp from 'sharp';

import { ColorRamp } from './functions/color.ramp.js';
import { ComputeContext, ComputeFunction } from './functions/compute.function.js';
import { TerrainRgb } from './functions/terrain.rgb.js';
import { Loader } from './loaders/loader.js';
import { LercLoader } from './loaders/loader.lerc.js';
import { SharpOverlay, TileMakerSharp } from './maker.js';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}

export class TileComputerSharp {
  width: number;
  height: number;

  loaders: Partial<Record<Compression, Loader>> = {
    [Compression.Lerc]: LercLoader,
  };

  functions: Partial<Record<string, ComputeFunction>> = {
    'terrain-rgb': TerrainRgb,
    'color-ramp': ColorRamp,
  };
  public constructor(width: number, height = width) {
    this.width = width;
    this.height = height;
  }

  async compute(ctx: {
    layers: Composition[];
    pipeline: ConfigTileSetComputedOutput;
    metrics: Metrics;
  }): Promise<{ buffer: Buffer; metrics: Metrics; layers: number }> {
    ctx.metrics.start('compute:overlay');
    const todo: Promise<SharpOverlay | null>[] = [];
    for (const comp of ctx.layers) {
      if (TileMakerSharp.isTooLarge(comp)) continue;
      if (comp.type !== 'tiff') continue;
      todo.push(this.computeLayer(comp, ctx.pipeline));
    }

    const overlays = await Promise.all(todo).then((items) => items.filter(notEmpty));
    ctx.metrics.end('compute:overlay');

    const img = Sharp({
      create: {
        width: this.width,
        height: this.height,
        channels: 4,
        background: ctx.pipeline.output.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    ctx.metrics.start('compute:compress');
    const buffer = await this.toImage(ctx.pipeline.output, img.composite(overlays));
    ctx.metrics.end('compute:compress');

    return {
      buffer,
      metrics: ctx.metrics,
      layers: overlays.length,
    };
  }

  toImage(output: ConfigComputeOutputFormat, img: Sharp.Sharp): Promise<Buffer> {
    switch (output.type) {
      case 'webp':
        return img.webp({ lossless: output.lossless, quality: output.level }).toBuffer();
      case 'png':
        return img.png().toBuffer();
      default:
        throw new Error(`Invalid image format "${output}"`);
    }
  }

  async computeLayer(
    comp: CompositionTiff,
    pipeline: ConfigTileSetComputedOutput,
    // _metrics: Metrics,
  ): Promise<SharpOverlay | null> {
    const img = comp.asset.images[comp.source.imageId];
    const tile = await img.getTile(comp.source.x, comp.source.y);
    if (tile == null) return null;

    // console.log(tile);
    const noData = img.noData;

    const sharp = await this.loaders[tile.compression]?.load({ buffer: tile.bytes, noData });
    if (sharp == null) return null;

    // console.log(sharp);
    // Extract the vars to make it easier to reference later
    const { extract, resize, crop } = comp;

    if (extract) sharp.extract({ top: 0, left: 0, width: extract.width, height: extract.height });

    if (resize) {
      const resizeKernel = pipeline.resizeKernel ?? { in: 'nearest', out: 'nearest' };
      const resizeOptions = {
        fit: Sharp.fit.cover,
        kernel: resize.scaleX > 1 ? resizeKernel.in : resizeKernel.out,
      };
      sharp.resize(resize.width, resize.height, resizeOptions);
    }

    if (crop) sharp.extract({ top: crop.y, left: crop.x, width: crop.width, height: crop.height });

    const ret = await sharp.raw({ depth: 'float' }).toBuffer({ resolveWithObject: true });

    let current: ComputeContext = {
      data: ret.data,
      width: ret.info.width,
      height: ret.info.height,
      channels: ret.info.channels,
    };

    console.log(current);

    for (const arg of pipeline.pipeline) {
      const func = this.functions[arg.function];
      if (func == null) throw new Error('Failed to find processing function ' + arg.function);
      current = await func.process(current);
    }

    return {
      input: current.data,
      top: comp.y,
      left: comp.x,
      raw: { width: current.width, height: current.height, channels: current.channels },
    };
  }
}
