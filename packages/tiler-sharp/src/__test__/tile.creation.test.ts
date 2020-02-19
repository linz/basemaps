import 'source-map-support/register';

import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { Tiler } from '@basemaps/tiler';
import PixelMatch = require('pixelmatch');
import { TileMakerSharp } from '..';
import * as o from 'ospec';
// To regenerate all the oed images set this to true and run the tests
const WRITE_IMAGES = false;

function getExpectedTileName(tileSize: number, x: number, y: number, zoom: number): string {
    return path.join(__dirname, `../../data/expected/tile_${tileSize}_${x}_${y}_z${zoom}.png`);
}
function getExpectedTile(tileSize: number, x: number, y: number, zoom: number): PNG {
    const fileName = getExpectedTileName(tileSize, x, y, zoom);
    const bytes = readFileSync(fileName);
    return PNG.sync.read(bytes);
}

o.spec('TileCreation', () => {
    // Tiff that is tiled and has WebMercator alignment for its resolution levels
    const tiffPath = path.join(__dirname, '../../data/rgba8_tiled.wm.tiff');
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
        // Make a really large tile so this image will be visible at zoom zero
        const tiler = new Tiler(2 ** 20);
        const layers = await tiler.tile([tiff], 0, 0, 0);

        o(layers).notEquals(null);
        if (layers == null) throw new Error('Tile is null');

        o(layers.length).equals(1);
        const [layer] = layers;
        o(layer.id).equals(tiff.source.name);
        o(layer.extract).deepEquals({ height: 16, width: 16 });
        o(layer.resize).deepEquals({ height: 2, width: 2 });
        o(layer.x).equals(tiler.tileSize / 2);
        o(layer.y).equals(tiler.tileSize / 2);
    });

    let RenderTests = [
        { tileSize: 256, zoom: 18 },
        { tileSize: 256, zoom: 19 },
        { tileSize: 512, zoom: 19 },
        { tileSize: 1024, zoom: 19 },
        { tileSize: 2048, zoom: 19 },
        { tileSize: 4096, zoom: 19 },
    ];

    // No need to run larger tile tests locally
    if (!process.env.GITHUB_ACTIONS) {
        RenderTests = RenderTests.slice(0, 1);
    }

    RenderTests.forEach(({ tileSize, zoom }) => {
        o(`should render a tile zoom:${zoom} tile: ${tileSize}`, async () => {
            o.timeout(30 * 1000);

            console.time(`Render zoom:${zoom} size:${tileSize}`);
            const center = 2 ** zoom;
            const centerTile = center / 2;
            const tiler = new Tiler(tileSize);

            const tileMaker = new TileMakerSharp(tileSize);
            // Make the background black to easily spot flaws
            tileMaker.background = { r: 0, g: 0, b: 0, alpha: 1 };

            const layers = await tiler.tile([tiff], centerTile, centerTile, zoom);
            o(layers).notEquals(null);
            if (layers == null) throw new Error('Tile is null');

            const png = await tileMaker.compose(layers);
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
            console.timeEnd(`Render zoom:${zoom} size:${tileSize}`);
        });
    });
});
