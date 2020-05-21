import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { ImageFormat, Tiler } from '@basemaps/tiler';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { readFileSync, writeFileSync } from 'fs';
import * as o from 'ospec';
import * as path from 'path';
import { PNG } from 'pngjs';
import { TileMakerSharp } from '..';
import PixelMatch = require('pixelmatch');
// To regenerate all the oed images set this to true and run the tests
const WRITE_IMAGES = false;

const background = { r: 0, g: 0, b: 0, alpha: 1 };

function getExpectedTileName(tileSize: number, x: number, y: number, zoom: number): string {
    return path.join(__dirname, `../../../../test-data/expected/tile_${tileSize}_${x}_${y}_z${zoom}.png`);
}
function getExpectedTile(tileSize: number, x: number, y: number, zoom: number): PNG {
    const fileName = getExpectedTileName(tileSize, x, y, zoom);
    const bytes = readFileSync(fileName);
    return PNG.sync.read(bytes);
}

o.spec('TileCreation', () => {
    // Tiff that is tiled and has WebMercator alignment for its resolution levels
    const tiffPath = path.join(__dirname, '../../../../test-data/rgba8_tiled.wm.tiff');
    let tiff: CogTiff;
    let tiffSource: CogSourceFile;

    o.beforeEach(async () => {
        tiffSource = new CogSourceFile(tiffPath);
        tiff = new CogTiff(tiffSource);
        await tiff.init();
    });

    o.afterEach(async () => {
        await tiffSource.close();
    });

    o('should generate a tile', async () => {
        const tiler = new Tiler(GoogleTms);

        const layer0 = await tiler.tile([tiff], 0, 0, 0);
        o(layer0.length).equals(0);

        const targetZoom = 12;
        const layers = await tiler.tile([tiff], 2 ** targetZoom / 2, 2 ** targetZoom / 2, targetZoom);

        o(layers.length).equals(1);
        const [layer] = layers;
        o(layer.tiff.source.name).equals(tiff.source.name);
        o(layer.extract).deepEquals({ height: 16, width: 16 });
        o(layer.resize).deepEquals({ height: 2, width: 2 });
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

    let RenderTests = [
        { tileSize: 256, zoom: 18 },
        { tileSize: 256, zoom: 19 },
        // FIXME
        // { tileSize: 512, zoom: 19 },
        // { tileSize: 1024, zoom: 19 },
        // { tileSize: 2048, zoom: 19 },
        // { tileSize: 4096, zoom: 19 },
    ];

    // No need to run larger tile tests locally
    if (!process.env.GITHUB_ACTIONS) {
        RenderTests = RenderTests.slice(0, 2);
    }

    RenderTests.forEach(({ tileSize, zoom }) => {
        o(`should render a tile zoom:${zoom} tile: ${tileSize}`, async () => {
            o.timeout(30 * 1000);

            const timeStr = `RenderTests: zoom ${zoom}, Size ${tileSize}, time`;
            console.time(timeStr);
            const center = 2 ** zoom;
            const centerTile = center / 2;
            const tiler = new Tiler(GoogleTms);

            const tileMaker = new TileMakerSharp(tileSize);

            const layers = await tiler.tile([tiff], centerTile, centerTile, zoom);

            const png = await tileMaker.compose({ layers, format: ImageFormat.PNG, background });
            const newImage = PNG.sync.read(png.buffer);
            if (WRITE_IMAGES) {
                const fileName = getExpectedTileName(tileSize, centerTile, centerTile, zoom);
                writeFileSync(fileName, png);
            }

            const oedImage = await getExpectedTile(tileSize, centerTile, centerTile, zoom);

            const missMatchedPixels = PixelMatch(oedImage.data, newImage.data, null, tileSize, tileSize);
            if (missMatchedPixels > 0) {
                const fileName = getExpectedTileName(tileSize, centerTile, centerTile, zoom) + '.diff.png';
                const output = new PNG({ width: tileSize, height: tileSize });
                PixelMatch(oedImage.data, newImage.data, output.data, tileSize, tileSize);
                writeFileSync(fileName, PNG.sync.write(output));
            }
            o(missMatchedPixels).equals(0);
            console.timeEnd(timeStr);
        });
    });
});
