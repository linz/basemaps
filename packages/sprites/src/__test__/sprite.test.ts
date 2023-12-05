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
      openstreetmap_shield_ca_qc_a_2: { width: 18, height: 20, x: 64, y: 0, pixelRatio: 1 },
      openstreetmap_shield_kr_expressway_2: { width: 20, height: 20, x: 82, y: 0, pixelRatio: 1 },
      openstreetmap_poi_plane: { width: 16, height: 18, x: 102, y: 0, pixelRatio: 1 },
      airport_aerodrome_pnt_fill: { width: 16, height: 16, x: 0, y: 32, pixelRatio: 1 },
      mast_pnt: { width: 16, height: 16, x: 16, y: 32, pixelRatio: 1 },
      openstreetmap_poi_bus: { width: 14, height: 15, x: 32, y: 32, pixelRatio: 1 },
    });
    const hashA = createHash('sha256').update(res[0].buffer).digest('base64url');
    o(hashA).equals('YbuSGRvtRMvb995LL3XZzQNLXm3gNEbo03JB8EYMPsk');

    o(res[1].layout).deepEquals({
      embankment_no_gap_cl_thick_wide: { width: 128, height: 64, x: 0, y: 0, pixelRatio: 2 },
      openstreetmap_shield_ca_qc_a_2: { width: 36, height: 40, x: 128, y: 0, pixelRatio: 2 },
      openstreetmap_shield_kr_expressway_2: { width: 40, height: 40, x: 164, y: 0, pixelRatio: 2 },
      openstreetmap_poi_plane: { width: 32, height: 36, x: 204, y: 0, pixelRatio: 2 },
      airport_aerodrome_pnt_fill: { width: 32, height: 32, x: 0, y: 64, pixelRatio: 2 },
      mast_pnt: { width: 32, height: 32, x: 32, y: 64, pixelRatio: 2 },
      openstreetmap_poi_bus: { width: 28, height: 30, x: 64, y: 64, pixelRatio: 2 },
    });
    const hashB = createHash('sha256').update(res[1].buffer).digest('base64url');
    o(hashB).equals('ksdwiwVlJE6b8jH6IRDDTHNdjaJG0_XQy3z4g3mOPf4');
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
    o(hashA).equals('NA9Y3npP9scNcnN829Z9Tm4Q3NpZ1wwXxbU1gIZnhp0');
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
      openstreetmap_shield_ca_qc_a_2: { width: 18, height: 20, x: 64, y: 0, pixelRatio: 1 },
      openstreetmap_shield_kr_expressway_2: { width: 20, height: 20, x: 82, y: 0, pixelRatio: 1 },
      openstreetmap_poi_plane: { width: 16, height: 18, x: 102, y: 0, pixelRatio: 1 },
      circle: { width: 17, height: 17, x: 0, y: 32, pixelRatio: 1 },
      airport_aerodrome_pnt_fill: { width: 16, height: 16, x: 17, y: 32, pixelRatio: 1 },
      mast_pnt: { width: 16, height: 16, x: 33, y: 32, pixelRatio: 1 },
      openstreetmap_poi_bus: { width: 14, height: 15, x: 49, y: 32, pixelRatio: 1 },
    });
    const hashA = createHash('sha256').update(res[0].buffer).digest('base64url');
    o(hashA).equals('p7cu_NTZ_WxxOqqgO_hqnd8gNMsahM21Zv63BFa3Psg');
  });
});
