import { Compression, Tiff } from '@cogeotiff/core';
import Lerc from 'lerc';

import { DecompressedInterleaved, Decompressor } from './decompressor.js';

let i = 0;
export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const id = `decode:${i++}`;
    console.time(id);
    const bytes = Lerc.decode(tile);
    console.timeEnd(id);

    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${source.source.url.href}`);
    }
    // console.log(bytes);
    // if (bytes.pixels) process.exit();

    // writeFileSync('output.bin', bytes.pixels[0]);

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
  [Compression.Lerc]: LercDecompressor,
};
