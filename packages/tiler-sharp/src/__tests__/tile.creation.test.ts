import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigTileSetRasterOutput } from '@basemaps/config';
import { Epsg, GoogleTms, Nztm2000Tms, QuadKey, Tile } from '@basemaps/geo';
import { fsa, Tiff } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { CompositionTiff, Tiler } from '@basemaps/tiler';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import PixelMatch from 'pixelmatch';
import { PNG } from 'pngjs';
import url from 'url';

import { TileMakerSharp } from '../index.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// To regenerate all the oed images set this to true and run the tests
const WRITE_IMAGES = false;

const background = { r: 0, g: 0, b: 0, alpha: 1 };
const resizeKernel = { in: 'nearest', out: 'lanczos3' } as const;

function getExpectedTileName(projection: Epsg, tileSize: number, tile: Tile): string {
  return path.join(
    __dirname,
    '..',
    '..',
    `static/expected_tile_${projection.code}_${tileSize}x${tileSize}_${tile.x}_${tile.y}_z${tile.z}.png`,
  );
}
function getExpectedTile(projection: Epsg, tileSize: number, tile: Tile): PNG {
  const fileName = getExpectedTileName(projection, tileSize, tile);
  const bytes = readFileSync(fileName);
  return PNG.sync.read(bytes);
}

describe('TileCreation', () => {
  // Ensure macosx has enough time to generate tiles
  // o.specTimeout(5000);

  it('should generate a tile', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Google));
    const tiler = new Tiler(GoogleTms);

    const layer0 = (await tiler.tile([tiff], 0, 0, 0)) as CompositionTiff[];
    // There are 16 tiles in this tiff, all should be used
    assert.equal(layer0.length, 16);

    const topLeft = layer0.find((f) => f.source.x === 0 && f.source.y === 0);
    assert.deepEqual(topLeft?.source, { x: 0, y: 0, imageId: 0, width: 16, height: 16 });
    assert.equal(topLeft?.asset.source.url, tiff.source.url);
    assert.deepEqual(topLeft?.resize, { width: 32, height: 32, scaleX: 2, scaleY: 2 });
    assert.equal(topLeft?.x, 64);
    assert.equal(topLeft?.y, 64);
    await tiff?.source.close?.();
  });

  it('should generate webp', async () => {
    const tileMaker = new TileMakerSharp(256);
    const res = await tileMaker.compose({
      layers: [],
      output: { title: '', extension: '.webp', output: { type: 'webp' } },
      background,
      resizeKernel,
    });
    // Image format `R I F F <fileSize (int32)> W E B P`
    const magicBytes = res.buffer.slice(0, 4);
    const magicWebP = res.buffer.slice(8, 12);
    assert.equal(magicBytes.toString(), 'RIFF');
    assert.equal(magicWebP.toString(), 'WEBP');
  });

  it('should generate jpeg', async () => {
    const tileMaker = new TileMakerSharp(256);
    const res = await tileMaker.compose({
      layers: [],
      output: { title: '', extension: '.jpeg', output: { type: 'jpeg' } },
      background,
      resizeKernel,
    });
    const magicBytes = res.buffer.slice(0, 4);
    assert.deepEqual(magicBytes.toJSON().data, [0xff, 0xd8, 0xff, 0xdb]);
  });

  it('should error when provided invalid image formats', async () => {
    const tileMaker = new TileMakerSharp(256);
    try {
      await tileMaker.compose({ layers: [], background } as any);
      assert.equal(true, false, 'invalid format');
    } catch (e: any) {
      assert.equal(e.message.includes('Invalid image'), true);
    }
  });

  const RenderTests = [
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('0') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('1') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('2') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('3') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('30') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('300') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('301') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('302') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('303') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('3000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('30000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('300000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('3000000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('30000000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('300000000000') },
    { tileSize: 256, tms: GoogleTms, tile: QuadKey.toTile('3000000000000') },

    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 1, y: 2, z: 0 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 1, y: 1, z: 0 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 0, y: 2, z: 0 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 0, y: 1, z: 0 } },

    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 4, y: 7, z: 2 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 4, y: 8, z: 2 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 5, y: 8, z: 2 } },
    { tileSize: 256, tms: Nztm2000Tms, tile: { x: 6, y: 8, z: 2 } }, // Empty tile
  ];

  const output: ConfigTileSetRasterOutput = {
    title: 'Png',
    output: { type: 'png', lossless: true },
    extension: '.png',
  };

  RenderTests.forEach(({ tileSize, tms, tile }) => {
    const projection = tms.projection;
    const tileText = `${tile.x}, ${tile.y} z${tile.z}`;
    it(`should render a tile ${tileText} tile: ${tileSize} projection: ${projection}`, async () => {
      // o.timeout(30 * 1000);

      const timeStr = `RenderTests(${projection}): ${tileText} ${tileSize}x${tileSize}  time`;
      console.time(timeStr);

      const url = projection === Epsg.Nztm2000 ? TestTiff.Nztm2000 : TestTiff.Google;
      const tiff = await Tiff.create(fsa.source(url));
      const tiler = new Tiler(tms);

      const tileMaker = new TileMakerSharp(tileSize);

      const layers = await tiler.tile([tiff], tile.x, tile.y, tile.z);

      const png = await tileMaker.compose({
        layers,
        output,
        background,
        resizeKernel,
      });
      const newImage = PNG.sync.read(png.buffer);
      if (WRITE_IMAGES) {
        const fileName = getExpectedTileName(projection, tileSize, tile);
        writeFileSync(fileName, png.buffer);
      }

      const oldImage = await getExpectedTile(projection, tileSize, tile);

      const missMatchedPixels = PixelMatch(oldImage.data, newImage.data, null, tileSize, tileSize);
      if (missMatchedPixels > 0) {
        const fileName = getExpectedTileName(projection, tileSize, tile) + '.diff.png';
        const output = new PNG({ width: tileSize, height: tileSize });
        PixelMatch(oldImage.data, newImage.data, output.data, tileSize, tileSize);
        writeFileSync(fileName, PNG.sync.write(output));
      }
      assert.equal(missMatchedPixels, 0);
      console.timeEnd(timeStr);
      await tiff.source.close?.();
    });
  });
});
