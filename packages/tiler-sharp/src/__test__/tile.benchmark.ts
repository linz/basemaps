import { GoogleTms } from '@basemaps/geo';
import { TestTiff } from '@basemaps/test';
import { ImageFormat, Tiler } from '@basemaps/tiler';
import 'source-map-support/register';
import { TileMakerSharp } from '../index.js';

const resizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const RenderCount = 100;
const Zoom = 19;

const Center = 2 ** Zoom;
const CenterTile = Center / 2;

const background = { r: 0, g: 0, b: 0, alpha: 1 };

async function main(): Promise<void> {
    const tileSize = Number(process.argv[process.argv.length - 1]);
    if (isNaN(tileSize) || tileSize < 256 || tileSize > 1024) {
        console.log('Tile size is invalid');
        return;
    }

    for (let i = 0; i < RenderCount; i++) {
        const tiler = new Tiler(GoogleTms);
        const tileMaker = new TileMakerSharp(tileSize);
        const tiff = await TestTiff.Google.init();

        const layers = await tiler.tile([tiff], CenterTile, CenterTile, Zoom);

        if (layers == null) throw new Error('Tile is null');
        await tileMaker.compose({ layers, format: ImageFormat.PNG, background, resizeKernel });
        await tiff.close();
    }
}

main().catch(console.error);
