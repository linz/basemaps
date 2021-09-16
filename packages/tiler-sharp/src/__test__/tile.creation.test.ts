import { Epsg, GoogleTms, Nztm2000Tms, QuadKey, Tile } from '@basemaps/geo';
import { TestTiff } from '@basemaps/test';
import { ImageFormat, Tiler } from '@basemaps/tiler';
import { readFileSync, writeFileSync } from 'fs';
import o from 'ospec';
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

o.spec('TileCreation', () => {
    o('should generate a tile', async () => {
        const tiff = await TestTiff.Google.init();
        const tiler = new Tiler(GoogleTms);

        const layer0 = await tiler.tile([tiff], 0, 0, 0);
        // There are 16 tiles in this tiff, all should be used
        o(layer0.length).equals(16);

        const topLeft = layer0.find((f) => f.source.x === 0 && f.source.y === 0);
        o(topLeft?.source).deepEquals({ x: 0, y: 0, imageId: 0, width: 16, height: 16 });
        o(topLeft?.tiff.source.name).equals(tiff.source.name);
        o(topLeft?.resize).deepEquals({ width: 32, height: 32, scale: 2 });
        o(topLeft?.x).equals(64);
        o(topLeft?.y).equals(64);
    });

    o('should generate webp', async () => {
        const tileMaker = new TileMakerSharp(256);
        const res = await tileMaker.compose({ layers: [], format: ImageFormat.WEBP, background, resizeKernel });
        // Image format `R I F F <fileSize (int32)> W E B P`
        const magicBytes = res.buffer.slice(0, 4);
        const magicWebP = res.buffer.slice(8, 12);
        o(magicBytes.toString()).equals('RIFF');
        o(magicWebP.toString()).equals('WEBP');
    });

    o('should generate jpeg', async () => {
        const tileMaker = new TileMakerSharp(256);
        const res = await tileMaker.compose({ layers: [], format: ImageFormat.JPEG, background, resizeKernel });
        const magicBytes = res.buffer.slice(0, 4);
        o(magicBytes.toJSON().data).deepEquals([0xff, 0xd8, 0xff, 0xdb]);
    });

    o('should error when provided invalid image formats', async () => {
        const tileMaker = new TileMakerSharp(256);
        try {
            await tileMaker.compose({ layers: [], background } as any);
            o(true).equals(false)('invalid format');
        } catch (e: any) {
            o(e.message.includes('Invalid image')).equals(true);
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

        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 1, y: 2, z: 0 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 1, y: 1, z: 0 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 0, y: 2, z: 0 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 0, y: 1, z: 0 } },

        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 4, y: 7, z: 2 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 4, y: 8, z: 2 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 5, y: 8, z: 2 } },
        { tileSize: 256, tms: Nztm2000Tms, tile: { x: 6, y: 8, z: 2 } }, // Empty tile
    ];

    RenderTests.forEach(({ tileSize, tms, tile }) => {
        const projection = tms.projection;
        const tileText = `${tile.x}, ${tile.y} z${tile.z}`;
        o(`should render a tile ${tileText} tile: ${tileSize} projection: ${projection}`, async () => {
            o.timeout(30 * 1000);

            const timeStr = `RenderTests(${projection}): ${tileText} ${tileSize}x${tileSize}  time`;
            console.time(timeStr);

            const tiff = projection === Epsg.Nztm2000 ? TestTiff.Nztm2000 : TestTiff.Google;
            await tiff.init();
            const tiler = new Tiler(tms);

            const tileMaker = new TileMakerSharp(tileSize);

            const layers = await tiler.tile([tiff], tile.x, tile.y, tile.z);

            const png = await tileMaker.compose({
                layers,
                format: ImageFormat.PNG,
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
            o(missMatchedPixels).equals(0);
            console.timeEnd(timeStr);
        });
    });
});
