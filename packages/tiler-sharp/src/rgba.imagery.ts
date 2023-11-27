import Sharp from 'sharp';
import Lerc from 'lerc';

export interface Decompressor {
  type: 'image/webp' | 'application/lerc';
  bytes(tile: ArrayBuffer): Sharp.Sharp | Promise<Sharp.Sharp>;
}

export const Webp: Decompressor = {
  type: 'image/webp',
  bytes(tile: ArrayBuffer): Sharp.Sharp {
    return Sharp(Buffer.from(tile));
  },
};

function lercDepth(s: string): string {
  switch (s) {
    case 'F32':
      return 'float';
    default:
      throw new Error('Unknown LERC Byte depth: ' + s);
  }
}

let lercIndex = 0;
export const LercDecompressor: Decompressor = {
  type: 'application/lerc',
  async bytes(tile: ArrayBuffer): Promise<Sharp.Sharp> {
    // lercIndex
    const idx = lercIndex++;
    // console.time('lerc:decode:' + idx);
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    // console.log(bytes);

    // TODO properly handle nodata
    for (let i = 0; i < bytes.pixels[0].length; i++) {
      if (bytes.pixels[0][i] === -9999) bytes.pixels[0][i] = NaN;
    }
    // console.timeEnd('lerc:decode:' + idx);
    // console.log(bytes);
    // console.log(bytes);
    // TODO support multichannel lerc
    const s = Sharp(bytes.pixels[0], {
      raw: { width: bytes.width, height: bytes.height, channels: 1 },
    });
    if (lercDepth(bytes.pixelType) === 'float') return s.raw({ depth: 'float' });
    return s;
  },
};

export const Decompressors: Record<string, Decompressor> = {
  [Webp.type]: Webp,
  [LercDecompressor.type]: LercDecompressor,
};
