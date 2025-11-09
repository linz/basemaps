import { before, beforeEach, describe, it, TestContext } from 'node:test';

import { ConfigProviderMemory, getAllImagery, sha256base58 } from '@basemaps/config';
import { ConfigJson } from '@basemaps/config-loader';
import { ConfigImageryTiff } from '@basemaps/config-loader/build/json/tiff.config.js';
import { Epsg, EpsgCode, GoogleTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import pLimit from 'p-limit';

import assert from 'assert';
import { prepareUrls } from '../cli/action.import.js';
import { TsElevation } from './config.diff.data.js';

function splitUrlIntoParts(e: URL): { tileMatrix: TileMatrixSet; name: string; gsd: number } {
  const parts = e.pathname.slice(1).split('/');

  if (e.hostname === 'linz-basemaps') {
    // /3857/:name/:id/
    let partOffset = 0;
    // /elevation/3857/:name/:id/
    if (parts[0] === 'elevation') partOffset++;

    return {
      tileMatrix: TileMatrixSets.get(Epsg.parseCode(parts[partOffset]) as EpsgCode),
      name: parts[partOffset + 1],
      gsd: parseFloat(parts[partOffset + 1].split('_').at(-1) ?? '0'),
    };
  }
  if (e.hostname === 'nz-imagery' || e.hostname === 'nz-elevation') {
    return {
      tileMatrix: TileMatrixSets.get(Epsg.parseCode(parts[3]) as EpsgCode),
      name: parts[1],
      gsd: 1,
    };
  }

  throw new Error('Unable to parse path: ' + e.href);
}

describe('action.import', () => {
  const fsMem = new FsMemory();
  const elevationJson = JSON.stringify(TsElevation);

  before(() => {
    // Imagery is linked from s3, overwrite s3 links to just use memory
    fsa.register('s3://', fsMem);
    fsa.register('source://', fsMem);

    LogConfig.get().level = 'silent';
  });

  async function stubLoadConfig(t: TestContext, source: string): Promise<ConfigProviderMemory> {
    t.mock.method(ConfigJson.prototype, 'initImageryFromTiffUrl', (url: URL) => {
      const parts = splitUrlIntoParts(url);

      const imagery: ConfigImageryTiff = {
        v: 2,
        id: `im_${sha256base58(url.href)}`,
        name: parts.name,
        title: parts.name,
        updatedAt: Date.now(),
        projection: parts.tileMatrix.projection.code,
        tileMatrix: parts.tileMatrix.identifier ?? 'none',
        gsd: parts.gsd,
        uri: url.href,
        url: url,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        bands: [
          { type: 'uint8', color: 'red' },
          { type: 'uint8', color: 'green' },
          { type: 'uint8', color: 'blue' },
          { type: 'uint8', color: 'alpha' },
        ],
        files: [],
      };
      return Promise.resolve(imagery);
    });

    const mem = await ConfigJson.fromUrl(new URL(source), pLimit(1), LogConfig.get());
    mem.createVirtualTileSets();
    return mem;
  }

  describe('elevation', () => {
    beforeEach(async () => {
      fsMem.files.clear();
      await fsa.write(fsa.toUrl('source://config/tileset/elevation.json'), elevationJson);
    });

    it.skip('should prepare a url for each pipeline', async (t) => {
      const cfg = await stubLoadConfig(t, 'source://config/');

      const tsElevation = await cfg.TileSet.get('elevation');
      assert.ok(tsElevation, 'Should have loaded the elevation tile set');
      assert.equal(tsElevation.layers.length, 3);

      const all3857 = await getAllImagery(cfg, tsElevation.layers, [Epsg.Google]);
      assert.equal(Array.from(all3857.keys()).length, 3);

      for (const id of all3857.keys()) {
        const urls = await prepareUrls(id, cfg, GoogleTms, 'FAKE_CONFIG_PATH');

        // ISSUE: doesn't produce the expected QA links for elevation imagery.
        // we should see `color-ramp` and `terrain-rgb` keys, but we don't.
        // the `import` CLI command itself doesn't see this issue.
        // I suspect I need to re-work the `stubLoadConfig` function.
        console.log({ id, urls: JSON.stringify(urls) });
      }
    });
  });
});
