import Lerc, { LercPixelType } from 'lerc';

import { DecompressedInterleaved, DecompressionContext, Decompressor } from './decompressor.js';

function convertPixelType(s: LercPixelType): DecompressedInterleaved['depth'] {
  switch (s) {
    case 'F32':
      return 'float32';
    case 'U8':
      return 'uint8';
    case 'U16':
      return 'uint16';
    case 'U32':
      return 'uint32';
  }

  throw new Error(`Unsupported pixel type: ${s}`);
}

export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async decompress(ctx: DecompressionContext): Promise<DecompressedInterleaved> {
    await Lerc.load();
    const bytes = Lerc.decode(ctx.bytes);

    const sourceUrl = ctx.tiff.source.url;

    if (bytes.depthCount !== 1) {
      throw new Error(`Lerc: Invalid output depthCount:${bytes.depthCount} from:${sourceUrl.href}`);
    }
    if (bytes.pixels.length !== 1) {
      throw new Error(`Lerc: Invalid output bandCount:${bytes.pixels.length} from:${sourceUrl.href}`);
    }

    return {
      buffer: bytes.pixels[0],
      width: bytes.width,
      height: bytes.height,
      channels: 1,
      depth: convertPixelType(bytes.pixelType),
    } as DecompressedInterleaved;
  },
};
