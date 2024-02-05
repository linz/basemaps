import { Compression, Tiff } from '@cogeotiff/core';
import Lerc from 'lerc';

import { DecompressedInterleaved, Decompressor } from './decompressor.js';

function lercDepth(s: string): string {
  switch (s) {
    case 'F32':
      return 'float';
    default:
      throw new Error('Unknown LERC Byte depth: ' + s);
  }
}

export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    if (lercDepth(bytes.pixelType) !== 'float') {
      throw new Error(`Lerc: Invalid output pixelType:${bytes.pixelType} from:${source.source.url}`);
    }
    if (bytes.depthCount !== 1) {
      throw new Error(`Lerc: Invalid output depthCount:${bytes.depthCount} from:${source.source.url}`);
    }
    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${source.source.url}`);
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
