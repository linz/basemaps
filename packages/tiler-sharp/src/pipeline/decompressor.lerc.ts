import { Compression, Tiff } from '@cogeotiff/core';
import Lerc from 'lerc';

import { DecompressedInterleaved, Decompressor, TiffTileId } from './decompressor.js';
import { ZstdDecompressor } from './decompressor.zstd.js';

export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(source: Tiff, _tileId: TiffTileId, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${source.source.url.href}`);
    }

    switch (bytes.pixelType) {
      case 'F32':
        return {
          pixels: bytes.pixels[0] as Float32Array,
          width: bytes.width,
          height: bytes.height,
          channels: bytes.depthCount,
          depth: 'float32',
        };
      case 'U32':
        return {
          pixels: bytes.pixels[0] as Uint32Array,
          width: bytes.width,
          height: bytes.height,
          channels: bytes.depthCount,
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
          channels: bytes.depthCount,
          depth: 'uint8',
        };
    }

    throw new Error(`Lerc: Invalid output pixelType:${bytes.pixelType} from:${source.source.url.href}`);
  },
};

export const Decompressors: Record<string, Decompressor> = {
  [LercDecompressor.type]: LercDecompressor,
  [Compression.Zstd]: ZstdDecompressor,
  [Compression.Lerc]: LercDecompressor,
};
