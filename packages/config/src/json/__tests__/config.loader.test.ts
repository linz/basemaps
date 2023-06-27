import { fsa } from '@chunkd/fs';
import { FsMemory, SourceMemory } from '@chunkd/source-memory';
import { fileURLToPath } from 'node:url';
import o from 'ospec';
import { ConfigProviderMemory } from '../../memory/memory.config.js';
import { initConfigFromUrls } from '../tiff.config.js';

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
    const buf = await fsa.read(fileURLToPath(simpleTiff));
    await fsa.write('memory://tiffs/tile-tiff-name/tiff-a.tiff', buf);

    const cfg = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(cfg, [new URL('memory://tiffs/tile-tiff-name')]);

    o(ret.imagery.length).equals(1);
    const imagery = ret.imagery[0];
    o(imagery.name).equals('tile-tiff-name');
    o(imagery.files).deepEquals([{ name: 'tiff-a.tiff', x: 0, y: -64, width: 64, height: 64 }]);
  });

  o('should create multiple imagery layers from multiple folders', async () => {
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
});

o.run();
