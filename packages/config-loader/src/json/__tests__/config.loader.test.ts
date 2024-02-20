import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { fsa, FsMemory, SourceMemory, Tiff } from '@basemaps/shared';
import { getTiffTagSize, TiffTag } from '@cogeotiff/core';

import { matchUri } from '../json.config.js';
import { getImageryName, initConfigFromUrls } from '../tiff.config.js';

const simpleTiff = new URL('../../../../__tests__/static/rgba8_tiled.tiff', import.meta.url);

describe('config import', () => {
  const fsMemory = new FsMemory();

  before(() => fsa.register('memory://', fsMemory));
  beforeEach(() => fsMemory.files.clear());

  it('should load tiff from filesystem', async () => {
    const buf = await fsa.read(simpleTiff);
    await fsa.write(new URL('memory://tiffs/tile-tiff-name/tiff-a.tiff'), buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name')]);

    assert.equal(ret.imagery.length, 1);
    const imagery = ret.imagery[0];
    assert.equal(imagery.name, 'tile-tiff-name');
    assert.deepEqual(imagery.files, [{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);

    assert.deepEqual(imagery.bands, [
      { type: 'uint', bits: 8 },
      { type: 'uint', bits: 8 },
      { type: 'uint', bits: 8 },
      { type: 'uint', bits: 8 },
    ]);

    assert.equal(imagery.noData, undefined);
  });

  it('should skip empty tiffs from filesystem', async () => {
    const buf = await fsa.read(simpleTiff);
    await fsa.write(new URL('memory://tiffs/tile-tiff-name/tiff-a.tiff'), buf);
    const tiff = await Tiff.create(new SourceMemory('memory://', buf));

    // Fun tiff hacking, find all the tileOffset and tileByteCount arrays and set them all to 0!
    const emptyTiff = Buffer.from(buf);
    for (const tagId of [TiffTag.TileByteCounts, TiffTag.TileOffsets]) {
      for (const img of tiff.images) {
        await img.fetch(tagId);
        const tagObj = img.tags.get(tagId);
        if (tagObj == null) throw new Error('Failed to load tag: ' + tagId);

        const dataSize = getTiffTagSize(tagObj.dataType);

        const dataOffset = tagObj.type === 'offset' ? tagObj.dataOffset : tagObj.tagOffset + 4 + tiff.ifdConfig.pointer;

        for (let i = 0; i < tagObj.count * dataSize; i++) emptyTiff[dataOffset + i] = 0;
      }
    }

    const tiffB = await Tiff.create(new SourceMemory('memory://', emptyTiff));
    // No images should have offsets
    for (const img of tiffB.images) {
      await img.fetch(TiffTag.TileOffsets);
      const value = img.tileOffset.value.find((f) => f > 0);
      assert.equal(value, undefined);
    }

    await fsa.write(new URL('memory://tiffs/tile-tiff-name/tiff-b.tiff'), emptyTiff);
    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name')]);

    assert.equal(ret.imagery.length, 1);
    const imagery = ret.imagery[0];
    assert.equal(imagery.name, 'tile-tiff-name');
    assert.deepEqual(imagery.files, [{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  it('should create multiple imagery layers from multiple folders', async () => {
    const buf = await fsa.read(simpleTiff);
    await fsa.write(new URL('memory://tiffs/tile-tiff-a/tiff-a.tiff'), buf);
    await fsa.write(new URL('memory://tiffs/tile-tiff-b/tiff-b.tiff'), buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [
      new URL('memory://tiffs/tile-tiff-a'),
      new URL('memory://tiffs/tile-tiff-b/'),
    ]);

    assert.equal(ret.imagery.length, 2);
    assert.equal(ret.imagery[0].name, 'tile-tiff-a');
    assert.deepEqual(ret.imagery[0].files, [{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);

    assert.equal(ret.imagery[1].name, 'tile-tiff-b');
    assert.deepEqual(ret.imagery[1].files, [{ name: 'tiff-b.tiff', x: 0, y: -64, width: 64, height: 64 }]);

    assert.equal(ret.tileSet.layers.length, 2);
    assert.equal(ret.tileSet.layers[0][3857], ret.imagery[0].id);
    assert.equal(ret.tileSet.layers[0].name, ret.imagery[0].name);
    assert.equal(ret.tileSet.layers[1][3857], ret.imagery[1].id);
    assert.equal(ret.tileSet.layers[1].name, ret.imagery[1].name);
  });

  it('should load tiff from filesystem with projection and imagery type in name', async () => {
    const buf = await fsa.read(simpleTiff);
    await fsa.write(new URL('memory://tiffs/tile-tiff-name/2193/rgb/tiff-a.tiff'), buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name/2193/rgb/')]);

    assert.equal(ret.imagery.length, 1);
    const imagery = ret.imagery[0];
    assert.equal(imagery.name, 'tile-tiff-name');
    assert.deepEqual(imagery.files, [{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  it('should ignore 2193 and rgb from imagery names', () => {
    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/rgb/')),
      'auckland_sn5600_1979_0.375m',
    );
    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/rgbi/')),
      'auckland_sn5600_1979_0.375m',
    );
    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/dem_1m/')),
      'auckland_sn5600_1979_0.375m',
    );
    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/dsm_1m/')),
      'auckland_sn5600_1979_0.375m',
    );
    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/3857/dsm_1m/')),
      'auckland_sn5600_1979_0.375m',
    );

    assert.equal(
      getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/3857/DSM_1m/')),
      'auckland_sn5600_1979_0.375m',
    );
  });

  it('should ignore argo folder names', () => {
    assert.equal(
      getImageryName(new URL('s3://linz-workflow-artifacts/2023-09/05-ecan-banks-peninsula-original-9mjdj/flat/')),
      '05-ecan-banks-peninsula-original-9mjdj',
    );
    assert.equal(
      getImageryName(new URL('s3://linz-workflows-scratch/2023-09/05-ecan-banks-peninsula-original-9mjdj/flat/')),
      '05-ecan-banks-peninsula-original-9mjdj',
    );
  });

  it('should match uris with trailing slashes or macros', () => {
    assert(
      matchUri(
        's3://linz-basemaps/3857/ōtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT/',
        's3://linz-basemaps/3857/%C5%8Dtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT/',
      ),
    );
    assert(
      matchUri(
        's3://linz-basemaps/3857/ōtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT/',
        's3://linz-basemaps/3857/ōtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT',
      ),
    );
  });
});
