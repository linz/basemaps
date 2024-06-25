import { Compression, Tiff } from '@cogeotiff/core';
import Lerc from 'lerc';

import { DecompressedInterleaved, Decompressor } from './decompressor.js';

export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    if (bytes.pixelType !== 'F32') {
      throw new Error(`Lerc: Invalid output pixelType:${bytes.pixelType} from:${source.source.url.href}`);
    }
    if (bytes.depthCount !== 1) {
      throw new Error(`Lerc: Invalid output depthCount:${bytes.depthCount} from:${source.source.url.href}`);
    }
    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${source.source.url.href}`);
    }

    return {
      pixels: bytes.pixels[0] as Float32Array,
      width: bytes.width,
      height: bytes.height,
      channels: 1,
      depth: 'float32',
    };
  },
};

export const Decompressors: Record<string, Decompressor> = {
  [LercDecompressor.type]: LercDecompressor,
  [Compression.Lerc]: LercDecompressor,
};
