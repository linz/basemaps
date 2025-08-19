import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg } from '../../../epsg.js';
import { Projection } from '../../projection.js';
import { ProjectionLoader } from '../../projection.loader.js';
import { ProjJsons } from '../proj.json.js';

describe('ProjJson', () => {
  it('should parse each unsupported EPSG code and ProjJSON pair into a runtime Epsg and Projection', async () => {
    for (const key of Object.keys(ProjJsons)) {
      const code = Number(key);

      // skip any already supported EPSG codes
      if (Epsg.tryGet(code) != null) continue;

      // ensure that neither an Epsg or Projection already exists
      assert.strictEqual(Epsg.tryGet(code), undefined);
      assert.strictEqual(Projection.tryGet(code), null);

      // ensure that both an Epsg and Projection now exist
      const epsg = await ProjectionLoader.load(code);
      assert.notStrictEqual(Epsg.tryGet(code), undefined);
      assert.notStrictEqual(Projection.tryGet(epsg), null);
    }
  });
});
