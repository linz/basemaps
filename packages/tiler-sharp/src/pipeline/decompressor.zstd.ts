import { promisify } from 'node:util';
import { zstdDecompress } from 'node:zlib';

import { Tiff, TiffTag } from '@basemaps/shared';
import { SampleFormat } from '@cogeotiff/core';

import { DecompressedInterleaved, Decompressor, TiffTileId } from './decompressor.js';

const decompressZstd = promisify(zstdDecompress);

function applyPredictor(data: DecompressedInterleaved, predictor?: number): DecompressedInterleaved {
  if (predictor !== 2) return data;

  let modulo = -1;
  switch (data.depth) {
    case 'uint8':
      modulo = 2 ** 8;
      break;
    case 'uint16':
      modulo = 2 ** 16;
      break;
  }

  if (modulo === -1) throw new Error('Only unit8 or uint16 predictor supported');

  for (let y = 0; y < data.height; y++) {
    const offset = y * data.channels * data.width;
    const offsetEnd = (y + 1) * data.channels * data.width;
    for (let i = offset + data.channels; i < offsetEnd; i++) {
      data.pixels[i] = (data.pixels[i] + data.pixels[i - data.channels]) % modulo;
    }
  }
  return data;
}

function createDecompressedInterleaved(
  tiff: Tiff,
  bytes: ArrayBuffer,
  sampleType: SampleFormat,
  sampleLength: number,
  channels: number,
  width: number,
  height: number,
): DecompressedInterleaved {
  switch (sampleType) {
    case SampleFormat.Float:
      if (sampleLength === 32) return { pixels: new Float32Array(bytes), depth: 'float32', channels, width, height };
      throw new Error('only float 32 supported: ' + tiff.source.url.href);
    case SampleFormat.Uint:
      if (sampleLength === 8) return { pixels: new Uint8ClampedArray(bytes), depth: 'uint8', channels, width, height };
      if (sampleLength === 16) return { pixels: new Uint16Array(bytes), depth: 'uint16', channels, width, height };
      if (sampleLength === 32) return { pixels: new Uint32Array(bytes), depth: 'uint32', channels, width, height };
      throw new Error(`Only uint8,uint16,uint32 supported: ${sampleLength} from: ${tiff.source.url.href}`);
  }
  throw new Error('Unknown sample/bit combination: ' + tiff.source.url.href);
}

async function tiffToTypedArrayBuffer(
  tiff: Tiff,
  tileId: TiffTileId,
  bytes: ArrayBuffer,
): Promise<DecompressedInterleaved> {
  const firstImage = tiff.images[0]; // some tags only exist on the first image
  const actualImage = tiff.images[tileId.imageId];

  const [dataType, bitsPerSample, predictor, width, height] = await Promise.all([
    firstImage.fetch(TiffTag.SampleFormat),
    firstImage.fetch(TiffTag.BitsPerSample),
    actualImage.fetch(TiffTag.Predictor),
    actualImage.fetch(TiffTag.TileWidth),
    actualImage.fetch(TiffTag.TileHeight),
  ]);

  const sampleType = (dataType?.[0] as SampleFormat) ?? SampleFormat.Uint;
  const sampleLength = bitsPerSample?.[0] ?? 8;
  const channels = bitsPerSample?.length ?? 1;
  if (height == null || width == null) throw new Error('Unknown width/height: ' + tiff.source.url.href);

  const data = createDecompressedInterleaved(tiff, bytes, sampleType, sampleLength, channels, width, height);

  return applyPredictor(data, predictor as number);
}

export const ZstdDecompressor: Decompressor = {
  type: 'application/zstd',
  async bytes(source: Tiff, tileId: TiffTileId, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    const bytes = await decompressZstd(tile);
    const output = await tiffToTypedArrayBuffer(
      source,
      tileId,
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    return output;
  },
};
