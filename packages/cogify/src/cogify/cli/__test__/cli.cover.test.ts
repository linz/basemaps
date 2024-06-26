import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { StacCollection } from 'stac-ts';

import { BasemapsCogifyCoverCommand } from '../cli.cover.js';

describe('cli.cover', () => {
  const fsMemory = new FsMemory();

  beforeEach(async () => {
    LogConfig.get().level = 'silent';
    fsa.register('memory://', fsMemory);
    fsMemory.files.clear();

    await fsa.write(new URL('memory://source/google.tiff'), fsa.readStream(TestTiff.Google));
  });

  const baseArgs = {
    paths: [new URL('memory://source/')],
    target: new URL('memory://target/'),
    preset: 'webp',
    tileMatrix: 'WebMercatorQuad',

    cutline: undefined,
    cutlineBlend: 20,
    baseZoomOffset: undefined,
    verbose: false,
    extraVerbose: false,
    requireStacCollection: false,
  };

  it('should generate a covering', async () => {
    const ret = await BasemapsCogifyCoverCommand.handler({ ...baseArgs }).catch((e) => String(e));
    assert.equal(ret, undefined); // no errors returned

    const files = [...fsMemory.files.keys()];
    const collectionJsonPath = files.find((f) => f.endsWith('collection.json') && f.startsWith('memory://target/'));
    assert.ok(collectionJsonPath);

    const collectionJson = JSON.parse(String(fsMemory.files.get(collectionJsonPath)?.buffer ?? '{}')) as StacCollection;
    assert.equal(collectionJson['description'], 'Missing source STAC');
  });

  it('should error if no collection.json is found', async () => {
    const ret = await BasemapsCogifyCoverCommand.handler({
      ...baseArgs,
      paths: [new URL('memory://source/')],
      target: new URL('memory://target/'),
      preset: 'webp',

      requireStacCollection: true,
      tileMatrix: 'WebMercatorQuad',
    }).catch((e) => String(e));

    assert.equal(ret, 'Error: No collection.json found with imagery: memory://source/');
  });
});
