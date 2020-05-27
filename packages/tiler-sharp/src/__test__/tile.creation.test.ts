import { Epsg, QuadKey } from '@basemaps/geo';
import { ImageFormat, Tiler } from '@basemaps/tiler';
import { readFileSync, writeFileSync } from 'fs';
import * as o from 'ospec';
import * as path from 'path';
import { PNG } from 'pngjs';
import { TileMakerSharp } from '..';
import { getTestingTiff, TestDataPath, getTms } from '@basemaps/geo/build/__tests__/test.tiff';
import PixelMatch = require('pixelmatch');
// To regenerate all the oed images set this to true and run the tests
const WRITE_IMAGES = true;

const background = { r: 0, g: 0, b: 0, alpha: 1 };

function getExpectedTileName(projection: Epsg, tileSize: number, qk: string): string {
    return path.join(TestDataPath, `/expected/tile_${projection.code}_${tileSize}x${tileSize}_${qk}.png`);
}
function getExpectedTile(projection: Epsg, tileSize: number, qk: string): PNG {
    const fileName = getExpectedTileName(projection, tileSize, qk);
    const bytes = readFileSync(fileName);
    return PNG.sync.read(bytes);
}

o.spec('TileCreation', () => {
    o('should generate a tile', async () => {
        const tiff = await getTestingTiff(Epsg.Google);
        const tiler = new Tiler(getTms(Epsg.Google));

        const layer0 = await tiler.tile([tiff], 0, 0, 0);
        // There are 16 tiles in this tiff, all should be used
        o(layer0.length).equals(16);

        const topLeft = layer0.find((f) => f.source.x == 0 && f.source.y == 0);
        o(topLeft?.tiff.source.name).equals(tiff.source.name);
        o(topLeft?.resize).deepEquals({ width: 32, height: 32 });
        o(topLeft?.x).equals(64);
        o(topLeft?.y).equals(64);
    });

    o('should generate webp', async () => {
        const tileMaker = new TileMakerSharp(256);
        const res = await tileMaker.compose({ layers: [], format: ImageFormat.WEBP, background });
        // Image format `R I F F <fileSize (int32)> W E B P`
        const magicBytes = res.buffer.slice(0, 4);
        const magicWebP = res.buffer.slice(8, 12);
        o(magicBytes.toString()).equals('RIFF');
        o(magicWebP.toString()).equals('WEBP');
    });

    o('should generate jpeg', async () => {
        const tileMaker = new TileMakerSharp(256);
        const res = await tileMaker.compose({ layers: [], format: ImageFormat.JPEG, background });
        const magicBytes = res.buffer.slice(0, 4);
        o(magicBytes.toJSON().data).deepEquals([0xff, 0xd8, 0xff, 0xdb]);
    });

    o('should error when provided invalid image formats', async () => {
        const tileMaker = new TileMakerSharp(256);
        try {
            await tileMaker.compose({ layers: [], background } as any);
            o(true).equals(false)('invalid format');
        } catch (e) {
            o(e.message.includes('Invalid image')).equals(true);
        }
    });

    const RenderTests = [
        { tileSize: 256, qk: '0' },
        { tileSize: 256, qk: '1' },
        { tileSize: 256, qk: '2' },
        { tileSize: 256, qk: '3' },
        { tileSize: 256, qk: '30' },
        { tileSize: 256, qk: '300' },
        { tileSize: 256, qk: '301' },
        { tileSize: 256, qk: '302' },
        { tileSize: 256, qk: '303' },

        // FIXME
        // { tileSize: 512, zoom: 19 },
        // { tileSize: 1024, zoom: 19 },
        // { tileSize: 2048, zoom: 19 },
        // { tileSize: 4096, zoom: 19 },
    ];
    const Projections = [
        Epsg.Google,
        // Epsg.Nztm2000
    ];

    Projections.forEach((projection) => {
        RenderTests.forEach(({ tileSize, qk }) => {
            o(`should render a tile ${qk} tile: ${tileSize} projection: ${projection}`, async () => {
                o.timeout(30 * 1000);

                const timeStr = `RenderTests: ${qk} Size ${tileSize}, Projection: ${projection} time`;
                console.time(timeStr);

                const tile = QuadKey.toTile(qk);
                const tiff = await getTestingTiff(projection);
                const tiler = new Tiler(getTms(projection));

                const tileMaker = new TileMakerSharp(tileSize);

                const layers = await tiler.tile([tiff], tile.x, tile.y, tile.z);

                const png = await tileMaker.compose({ layers, format: ImageFormat.PNG, background });
                const newImage = PNG.sync.read(png.buffer);
                if (WRITE_IMAGES) {
                    const fileName = getExpectedTileName(projection, tileSize, qk);
                    writeFileSync(fileName, png.buffer);
                }

                const oedImage = await getExpectedTile(projection, tileSize, qk);

                const missMatchedPixels = PixelMatch(oedImage.data, newImage.data, null, tileSize, tileSize);
                if (missMatchedPixels > 0) {
                    const fileName = getExpectedTileName(projection, tileSize, qk) + '.diff.png';
                    const output = new PNG({ width: tileSize, height: tileSize });
                    PixelMatch(oedImage.data, newImage.data, output.data, tileSize, tileSize);
                    writeFileSync(fileName, PNG.sync.write(output));
                }
                o(missMatchedPixels).equals(0);
                console.timeEnd(timeStr);
            });
        });
    });
});
