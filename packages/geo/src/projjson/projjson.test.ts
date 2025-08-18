import { notStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg } from '../epsg.js';
import { Projection } from '../proj/projection.js';
import { ProjectionLoader } from '../proj/projection.loader.js';

describe('ProjJson', () => {
  it('should parse the aktm2000 projjson into a runtime projection', async () => {
    const code = 3788;
    strictEqual(Epsg.tryGet(code), undefined);
    const epsg = await ProjectionLoader.load(code);
    const projection = Projection.tryGet(epsg);
    notStrictEqual(projection, null);
  });
});
