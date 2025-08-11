import { Compression, Tiff } from '@cogeotiff/core';
import Lerc from 'lerc';

import { DecompressedInterleaved, Decompressor } from './decompressor.js';

export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    if (bytes.depthCount !== 1) {
      throw new Error(`Lerc: Invalid output depthCount:${bytes.depthCount} from:${source.source.url.href}`);
    }
    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${source.source.url.href}`);
    }

    switch (bytes.pixelType) {
      case 'F32':
        return {
          pixels: bytes.pixels[0] as Float32Array,
          width: bytes.width,
          height: bytes.height,
          channels: 1,
          depth: 'float32',
        };
      case 'U32':
        return {
          pixels: bytes.pixels[0] as Uint32Array,
          width: bytes.width,
          height: bytes.height,
          channels: 1,
          depth: 'uint32',
        };
      case 'U16':
        return {
          pixels: bytes.pixels[0] as Uint16Array,
          width: bytes.width,
          height: bytes.height,
          channels: bytes.depthCount,
          depth: 'uint16',
        };
      case 'U8':
        return {
          pixels: bytes.pixels[0] as Uint8Array,
          width: bytes.width,
          height: bytes.height,
          channels: 1,
          depth: 'uint8',
        };
    }

    throw new Error(`Lerc: Invalid output pixelType:${bytes.pixelType} from:${source.source.url.href}`);
  },
};

export const Decompressors: Record<string, Decompressor> = {
  [LercDecompressor.type]: LercDecompressor,
  [Compression.Lerc]: LercDecompressor,
};
