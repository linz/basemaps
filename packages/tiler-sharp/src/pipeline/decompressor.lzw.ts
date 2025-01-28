import { TiffTag } from '@cogeotiff/core';

import {
  DecompressedInterleaved,
  DecompressionContext,
  Decompressor,
  tiffToDepth,
  toTypedBuffer,
} from './decompressor.js';
import { decompress } from './lzw/lzw.js';
import { decodeLzwTiff } from './lzw/lzw.sharp.js';

async function toDecompressedInterleaved(
  source: ArrayBuffer,
  ctx: DecompressionContext,
): Promise<DecompressedInterleaved> {
  const image = ctx.tiff.images[ctx.imageId];
  const [bitsPerSample, sampleFormat] = await Promise.all([
    image.fetch(TiffTag.BitsPerSample),
    image.fetch(TiffTag.SampleFormat),
  ]);

  if (bitsPerSample == null) throw new Error('Unable to fetch TiffTag: BitsPerSample');

  const depth = tiffToDepth(bitsPerSample, sampleFormat?.[0]);
  const buffer = toTypedBuffer(source, depth);

  const tileSizes = image.tileSize;

  const output = {
    depth,
    buffer,
    width: tileSizes.width,
    height: tileSizes.height,
    channels: bitsPerSample.length,
  } as DecompressedInterleaved;

  const estimatedSize = tileSizes.width * tileSizes.height * bitsPerSample.length;

  if (estimatedSize === output.buffer.length) return output; // Full sized tile

  // Sometimes tiles are
  const tileSize = image.getTileBounds(ctx.x, ctx.y);
  const calculatedTileSize = tileSize.width * tileSize.height * bitsPerSample.length;
  if (calculatedTileSize === output.buffer.length) {
    output.width = tileSize.width;
    output.height = tileSize.height;
    return output;
  }

  throw new Error('Output has missmatched tile size');
}

export const LzwDecompressor: Decompressor = {
  type: 'application/lzw',
  async decompress(ctx: DecompressionContext): Promise<DecompressedInterleaved> {
    // TODO: this decompressor is very slow it can take over 100ms+ to deocode a 512x512 tile
    // for comparison the lerc decompressor takes <1ms for the same amount of data.

    console.time('decompress-js');
    const bytes = decompress(ctx.bytes);
    console.timeEnd('decompress-js');

    // console.log(ctx.tiff.source.url.href);
    return toDecompressedInterleaved(bytes, ctx);
  },
};
export const LzwDecompressorSharp: Decompressor = {
  type: 'application/lzw',
  async decompress(ctx: DecompressionContext): Promise<DecompressedInterleaved> {
    // TODO: this decompressor is very slow it can take over 100ms+ to deocode a 512x512 tile
    // for comparison the lerc decompressor takes <1ms for the same amount of data.
    const image = ctx.tiff.images[ctx.imageId];
    const [bitsPerSample, sampleFormat] = await Promise.all([
      image.fetch(TiffTag.BitsPerSample),
      image.fetch(TiffTag.SampleFormat),
    ]);

    if (bitsPerSample == null) throw new Error('Unable to fetch TiffTag: BitsPerSample');

    const depth = tiffToDepth(bitsPerSample, sampleFormat?.[0]);

    console.time('decompress-sharp');
    const bytes = await decodeLzwTiff(image, depth, bitsPerSample.length, ctx.bytes);
    console.timeEnd('decompress-sharp');

    // console.log(ctx.tiff.source.url.href);
    return toDecompressedInterleaved(bytes.decoded, ctx);
  },
};
