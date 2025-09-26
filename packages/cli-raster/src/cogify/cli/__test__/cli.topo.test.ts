import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { StacCollection } from 'stac-ts';

import { TopoStacCreationCommand } from '../cli.topo.js';

describe('cli.topo', () => {
  const fsMemory = new FsMemory();

  beforeEach(async () => {
    LogConfig.get().level = 'silent';
    fsa.register('memory://', fsMemory);
    fsMemory.files.clear();

    await fsa.write(new URL('memory://source/CJ10_GRIDLESS_GeoTifv1-00.tif'), fsa.readStream(TestTiff.Nztm2000));
    await fsa.write(new URL('memory://source/CJ10_GRIDLESS_GeoTifv1-01.tif'), fsa.readStream(TestTiff.Nztm2000));
  });

  const baseArgs = {
    paths: [new URL('memory://source/')],
    target: new URL('memory://target/'),
    mapSeries: 'topo50',
    format: 'gridless',
    latestOnly: false,
    title: undefined,
    output: undefined,

    // extra logging arguments
    verbose: false,
    extraVerbose: false,
  };

  it('should generate a covering', async () => {
    const ret = await TopoStacCreationCommand.handler({ ...baseArgs }).catch((e) => String(e));
    assert.equal(ret, undefined); // no errors returned

    const files = [...fsMemory.files.keys()];
    files.sort();

    assert.deepEqual(files, [
      'memory://source/CJ10_GRIDLESS_GeoTifv1-00.tif',
      'memory://source/CJ10_GRIDLESS_GeoTifv1-01.tif',
      'memory://target/topo50/gridless_600dpi/2193/CJ10_v1-00.json',
      'memory://target/topo50/gridless_600dpi/2193/CJ10_v1-01.json',
      'memory://target/topo50/gridless_600dpi/2193/collection.json',
      'memory://target/topo50_latest/gridless_600dpi/2193/CJ10.json',
      'memory://target/topo50_latest/gridless_600dpi/2193/collection.json',
    ]);

    const collectionJson = await fsa.readJson<StacCollection>(
      new URL('memory://target/topo50/gridless_600dpi/2193/collection.json'),
    );
    assert.equal(collectionJson['description'], 'Topographic maps of New Zealand');
    assert.equal(collectionJson['linz:slug'], 'topo50-new-zealand-mainland');
    assert.equal(collectionJson['linz:region'], 'new-zealand');

    const latestItemUrl = new URL('memory://target/topo50_latest/gridless_600dpi/2193/CJ10.json');
    const latestVersion = await fsa.readJson<StacCollection>(latestItemUrl);

    // Latest file should be derived_from the source file
    const derived = latestVersion.links.filter((f) => f.rel === 'derived_from');
    assert.equal(derived.length, 1);

    const derivedFile = new URL(derived[0].href, latestItemUrl);
    assert.equal(derivedFile.href, 'memory://target/topo50/gridless_600dpi/2193/CJ10_v1-01.json');
  });
});
