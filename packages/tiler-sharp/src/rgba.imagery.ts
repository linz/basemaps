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
    // const id= lercIndex ++;
    // console.time('tile:' + lercIndex)
    // lercIndex
    const idx = lercIndex++;
    console.time('lerc:decode:' + idx);
    await Lerc.load();
    const bytes = Lerc.decode(tile);

    // console.log(bytes);

    // // TODO properly handle nodata
    // for (let i = 0; i < bytes.pixels[0].length; i++) {
    //   const px = bytes.pixels[0][i]
    //   if (px === -9999 || px <= -32767) bytes.pixels[0][i] = 0;
    // }
    // // console.log(bytes);
    // console.log(bytes);
    // TODO support multichannel lerc

    const buffer = new Float32Array(bytes.width * bytes.height * 4);

    for (let i = 0; i < bytes.pixels[0].length; i++) {
      const px = bytes.pixels[0][i];

      const offset = i * 4;

      if (px === -9999 || px <= -32767) {
        buffer[offset] = 1;
        buffer[offset + 1] = 0;
        buffer[offset + 2] = 0;
        buffer[offset + 3] = 0;
      } else {
        buffer[offset] = px;
        buffer[offset + 3] = 255;
      }
    }

    const s = Sharp(buffer, {
      raw: { width: bytes.width, height: bytes.height, channels: 4 },
    });
    if (lercDepth(bytes.pixelType) === 'float') {
      const buf = s.raw({ depth: 'float' });
      console.timeEnd('lerc:decode:' + idx);

      // console.log(buf.length)
      return buf;
    }
    console.timeEnd('lerc:decode:' + idx);

    return s;
  },
};

export const Decompressors: Record<string, Decompressor> = {
  [Webp.type]: Webp,
  [LercDecompressor.type]: LercDecompressor,
};
