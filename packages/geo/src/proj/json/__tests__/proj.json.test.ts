import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg } from '../../../epsg.js';
import { Projection } from '../../projection.js';
import { ProjectionLoader } from '../../projection.loader.js';
import { UtmZone } from '../../utmzone.js';
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

  /**
   * Warning: This test makes 60 third-party API calls and takes a few seconds to execute.
   */
  it('should generate a ProjJSON for each UTM Zone EPSG code that matches the spatialreference.org ProjJSON', async () => {
    for (let code = 32701; code <= 32760; code++) {
      const generatedProjJson = UtmZone.generateProjJson(code);
      const fetchedProjJson = await ProjectionLoader.fetchProjJson(code);

      /**
       * The 'area' property sometimes has extra text after the expected sentence.
       * Slice it off the fetched ProjJSON so it doesn't interrupt the comparison.
       *
       * @example https://spatialreference.org/ref/epsg/32714/projjson.json
       * @example https://spatialreference.org/ref/epsg/32715/projjson.json
       */
      fetchedProjJson.area = fetchedProjJson.area?.substring(0, fetchedProjJson.area.indexOf('.') + 1);

      assert.strictEqual(
        JSON.stringify(generatedProjJson),
        JSON.stringify(fetchedProjJson),
        `The generated and fetched ProjJSONs are not identical for code: ${code}`,
      );
    }
  });
});
