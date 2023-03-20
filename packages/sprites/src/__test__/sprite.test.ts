import { createHash } from 'crypto';
import o from 'ospec';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listSprites, ValidExtensions } from '../fs.js';
import { Sprites } from '../sprites.js';

o.spec('Sprites', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  o.beforeEach(() => {
    ValidExtensions.clear();
    ValidExtensions.add('.svg');
  });

  o.specTimeout(2_500);
  o('should generate sprites from examples', async () => {
    const baseSprites = join(__dirname, '../../static/sprites');

    const files = await listSprites(baseSprites);
    const res = await Sprites.generate(files, [1, 2]);

    o(res[0].layout).deepEquals({
      embankment_no_gap_cl_thick_wide: { width: 64, height: 32, x: 0, y: 0, pixelRatio: 1 },
      airport_aerodrome_pnt_fill: { width: 16, height: 16, x: 64, y: 0, pixelRatio: 1 },
      mast_pnt: { width: 16, height: 16, x: 80, y: 0, pixelRatio: 1 },
    });
    const hashA = createHash('sha256').update(res[0].buffer).digest('base64url');
    o(hashA).equals('Ggst1UBrnKmtkFokCIkmGSW0S7i0jXEtInfTWWCBVCY');

    o(res[1].layout).deepEquals({
      embankment_no_gap_cl_thick_wide: { width: 128, height: 64, x: 0, y: 0, pixelRatio: 2 },
      airport_aerodrome_pnt_fill: { width: 32, height: 32, x: 128, y: 0, pixelRatio: 2 },
      mast_pnt: { width: 32, height: 32, x: 160, y: 0, pixelRatio: 2 },
    });
    const hashB = createHash('sha256').update(res[1].buffer).digest('base64url');
    o(hashB).equals('kM-6X4tpLicvxm1rnIDZq4vultMG5pDutRczJd2MteE');
  });

  o('should generate sprites from from examples including images', async () => {
    const baseSprites = join(__dirname, '../../static/sprites');

    ValidExtensions.clear();
    ValidExtensions.add('.png');

    const files = await listSprites(baseSprites);
    const res = await Sprites.generate(files, [1, 2]);

    o(res[0].layout).deepEquals({
      circle: { width: 17, height: 17, x: 0, y: 0, pixelRatio: 1 },
    });
    const hashA = createHash('sha256').update(res[0].buffer).digest('base64url');
    o(hashA).equals('pYs-QfTjaCURzq7MDk1CtYvIEVtoW9dAGwq5hwZil2g');
  });

  o('should support both svg and png sprites in one image', async () => {
    const baseSprites = join(__dirname, '../../static/sprites');

    ValidExtensions.clear();
    ValidExtensions.add('.png');
    ValidExtensions.add('.svg');

    const files = await listSprites(baseSprites);
    const res = await Sprites.generate(files, [1, 2]);

    o(res[0].layout).deepEquals({
      embankment_no_gap_cl_thick_wide: { width: 64, height: 32, x: 0, y: 0, pixelRatio: 1 },
      circle: { width: 17, height: 17, x: 64, y: 0, pixelRatio: 1 },
      airport_aerodrome_pnt_fill: { width: 16, height: 16, x: 81, y: 0, pixelRatio: 1 },
      mast_pnt: { width: 16, height: 16, x: 97, y: 0, pixelRatio: 1 },
    });
    const hashA = createHash('sha256').update(res[0].buffer).digest('base64url');
    o(hashA).equals('kVGL6hInF6b1i-2DZYY-TDHGF9HFloOTT5ARaN0sdqA');
  });
});
