import Lerc from 'lerc';
import Sharp from 'sharp';

import { Loader, LoaderContext } from './loader.js';

function assertLercFloat32(s: string): string {
  switch (s) {
    case 'F32':
      return 'float';
    default:
      throw new Error('Unknown LERC Byte depth: ' + s);
  }
}

export const LercLoader: Loader = {
  name: 'lerc',
  async load(ctx: LoaderContext): Promise<Sharp.Sharp> {
    await Lerc.load();
    const bytes = Lerc.decode(ctx.buffer);

    // We currently only support float32 computed values
    assertLercFloat32(bytes.pixelType);

    console.log(bytes, { noData: ctx.noData });
    // If there is no nodata we don't need to modify the bytes
    if (ctx.noData == null) {
      return Sharp(Buffer.from(bytes.pixels[0]), {
        raw: { width: bytes.width, height: bytes.height, channels: 1 },
      })
        .pipelineColorspace('b-w')
        .toColourspace('b-w')
        .raw({ depth: 'float' });
    }

    // // If there is noData convert the one band image into a 4 band image with alpha as noData
    // // for lib vips to do the rescaling
    const buffer = new Float32Array(bytes.width * bytes.height * 4);
    let hasNoData = false;
    for (let i = 0; i < bytes.pixels[0].length; i++) {
      const px = bytes.pixels[0][i];

      const offset = i * 4;

      if (px === ctx.noData) {
        hasNoData = true;
        buffer[offset] = 1;
        // buffer[offset + 1] = 0;
        // buffer[offset + 2] = 0;
        // buffer[offset + 3] = 0;
      } else {
        // console.log(offset, px);
        buffer[offset] = px;
        // buffer[offset + 1] = px;
        // buffer[offset + 2] = px;
        buffer[offset + 3] = 255;
      }
    }

    // NoData was not found in the image, just use the one band image
    // if (hasNoData === false) {
    //   return Sharp(bytes.pixels[0], {
    //     raw: { width: bytes.width, height: bytes.height, channels: 1 },
    //   }).raw({ depth: 'float' });
    // }

    console.log({ hasNoData });
    return Sharp(buffer, {
      raw: { width: bytes.width, height: bytes.height, channels: 4 },
    }).raw({ depth: 'float' });
    // // .toColorspace('b-w');
  },
};
