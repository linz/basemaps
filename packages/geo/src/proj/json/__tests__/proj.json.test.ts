import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg } from '../../../epsg.js';
import { Projection } from '../../projection.js';
import { ProjectionLoader } from '../../projection.loader.js';

describe('ProjJson', () => {
  it('should parse the AKTM2000 projjson into a runtime projection', async () => {
    const code = 3788;
    assert.strictEqual(Epsg.tryGet(code), undefined);
    const epsg = await ProjectionLoader.load(code);
    const projection = Projection.tryGet(epsg);
    assert.notStrictEqual(projection, null);
  });
});
