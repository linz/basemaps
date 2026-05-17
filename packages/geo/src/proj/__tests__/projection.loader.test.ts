import assert from 'node:assert';
import { describe, it, TestContext } from 'node:test';

import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { Aitm2000Json } from '../json/nzoi/aitm2000.js';
import { ProjectionLoader } from '../projection.loader.js';

/** Arbitrary EPSG code not in ProjJsons and not pre-registered */
const TestCode: number = 99999;

describe('ProjectionLoader', () => {
  it('should handle concurrent loads for the same code without throwing', async (t: TestContext) => {
    t.mock.method(
      ProjectionLoader,
      'fetchProjJson',
      (): Promise<PROJJSONDefinition> =>
        Promise.resolve({ ...Aitm2000Json, id: { authority: 'EPSG', code: TestCode } }),
    );

    const [epsgA, epsgB] = await Promise.all([ProjectionLoader.load(TestCode), ProjectionLoader.load(TestCode)]);

    assert.equal(epsgA.code, TestCode);
    assert.equal(epsgB.code, TestCode);
    assert.equal(epsgA, epsgB);
  });
});
