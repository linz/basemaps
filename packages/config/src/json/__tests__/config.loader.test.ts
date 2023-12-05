import { fileURLToPath } from 'node:url';

import { fsa } from '@chunkd/fs';
import { FsMemory, SourceMemory } from '@chunkd/source-memory';
import { CogTiff } from '@cogeotiff/core';
import o from 'ospec';

import { ConfigProviderMemory } from '../../memory/memory.config.js';
import { getImageryName, initConfigFromUrls } from '../tiff.config.js';

const simpleTiff = new URL('../../../../__tests__/static/rgba8_tiled.tiff', import.meta.url);

o.spec('config import', () => {
  const fsMemory = new FsMemory();

  // TODO SourceMemory adds `memory://` to every url even if it already has a `memory://` prefix
  fsMemory.source = (filePath): SourceMemory => {
    const bytes = fsMemory.files.get(filePath);
    if (bytes == null) throw new Error('Failed to load file: ' + filePath);
    return new SourceMemory(filePath.replace('memory://', ''), bytes);
  };

  o.before(() => fsa.register('memory://', fsMemory));
  o.beforeEach(() => fsMemory.files.clear());

  o('should load tiff from filesystem', async () => {
    o.timeout(1000);

    const buf = await fsa.read(fileURLToPath(simpleTiff));
    await fsa.write('memory://tiffs/tile-tiff-name/tiff-a.tiff', buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name')]);

    o(ret.imagery.length).equals(1);
    const imagery = ret.imagery[0];
    o(imagery.name).equals('tile-tiff-name');
    o(imagery.files).deepEquals([{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  o('should skip empty tiffs from filesystem', async () => {
    o.timeout(1000);

    const buf = await fsa.read(fileURLToPath(simpleTiff));
    await fsa.write('memory://tiffs/tile-tiff-name/tiff-a.tiff', buf);
    const tiff = await CogTiff.create(new SourceMemory('memory://', buf));

    // Fun tiff hacking, find all the tileOffset arrays and set them all to 0!
    const emptyTiff = Buffer.from(buf);
    for (const img of tiff.images) {
      const tileOffsets = img.tileOffset;
      // Location in the file where this tag starts
      const tagOffset = tileOffsets.valuePointer;

      for (let i = 0; i < tileOffsets.dataLength; i++) emptyTiff[tagOffset + i] = 0;
    }

    await fsa.write('memory://tiffs/tile-tiff-name/tiff-b.tiff', emptyTiff);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name')]);

    o(ret.imagery.length).equals(1);
    const imagery = ret.imagery[0];
    o(imagery.name).equals('tile-tiff-name');
    o(imagery.files).deepEquals([{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  o('should create multiple imagery layers from multiple folders', async () => {
    o.timeout(1000);

    const buf = await fsa.read(fileURLToPath(simpleTiff));
    await fsa.write('memory://tiffs/tile-tiff-a/tiff-a.tiff', buf);
    await fsa.write('memory://tiffs/tile-tiff-b/tiff-b.tiff', buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [
      new URL('memory://tiffs/tile-tiff-a'),
      new URL('memory://tiffs/tile-tiff-b/'),
    ]);

    o(ret.imagery.length).equals(2);
    o(ret.imagery[0].name).equals('tile-tiff-a');
    o(ret.imagery[0].files).deepEquals([{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);

    o(ret.imagery[1].name).equals('tile-tiff-b');
    o(ret.imagery[1].files).deepEquals([{ name: 'tiff-b.tiff', x: 0, y: -64, width: 64, height: 64 }]);

    o(ret.tileSet.layers.length).equals(2);
    o(ret.tileSet.layers[0][3857]).equals(ret.imagery[0].id);
    o(ret.tileSet.layers[0].name).equals(ret.imagery[0].name);
    o(ret.tileSet.layers[1][3857]).equals(ret.imagery[1].id);
    o(ret.tileSet.layers[1].name).equals(ret.imagery[1].name);
  });

  o('should load tiff from filesystem with projection and imagery type in name', async () => {
    o.timeout(1000);

    const buf = await fsa.read(fileURLToPath(simpleTiff));
    await fsa.write('memory://tiffs/tile-tiff-name/2193/rgb/tiff-a.tiff', buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name/2193/rgb/')]);

    o(ret.imagery.length).equals(1);
    const imagery = ret.imagery[0];
    o(imagery.name).equals('tile-tiff-name');
    o(imagery.files).deepEquals([{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  o('should ignore 2193 and rgb from imagery names', () => {
    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/rgb/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );
    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/rgbi/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );
    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/dem_1m/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );
    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/2193/dsm_1m/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );
    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/3857/dsm_1m/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );

    o(getImageryName(new URL('s3://linz-imagery/auckland/auckland_sn5600_1979_0.375m/3857/DSM_1m/'))).equals(
      'auckland_sn5600_1979_0.375m',
    );
  });

  o('should ignore argo folder names', () => {
    o(
      getImageryName(new URL('s3://linz-workflow-artifacts/2023-09/05-ecan-banks-peninsula-original-9mjdj/flat/')),
    ).equals('05-ecan-banks-peninsula-original-9mjdj');
    o(
      getImageryName(new URL('s3://linz-workflows-scratch/2023-09/05-ecan-banks-peninsula-original-9mjdj/flat/')),
    ).equals('05-ecan-banks-peninsula-original-9mjdj');
  });
});
