import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { Tiler } from '@basemaps/tiler';
import { Metrics } from '@basemaps/metrics';
import { TileMakerSharp } from '..';

describe('TileCreationBenchmark', () => {
    const NanoSecondToMillisecond = 1e6;
    const RenderCount = 5;
    const TimeoutSeconds = 30 * 1000;
    const Zoom = 19;

    const Center = 2 ** Zoom;
    const CenterTile = Center / 2;

    const TiffPath = path.join(__dirname, '../../data/rgba8_tiled.wm.tiff');
    const timer = new Metrics();

    async function renderTile(tileSize: number): Promise<void> {
        const tiler = new Tiler(tileSize);
        const tileMaker = new TileMakerSharp(tileSize);

        timer.start('tiff:init');
        const tiff = new CogTiff(new CogSourceFile(TiffPath));
        await tiff.init();
        timer.end('tiff:init');

        timer.start('tiler:tile');
        const layers = await tiler.tile([tiff], CenterTile, CenterTile, Zoom);
        timer.end('tiler:tile');

        if (layers == null) throw new Error('Tile is null');
        await tileMaker.compose(layers);
    }
    const results: Record<string, Record<string, number[]>> = {};

    [256, 512].forEach(tileSize => {
        it(`should render ${RenderCount}x${tileSize} tiles`, async () => {
            jest.setTimeout(TimeoutSeconds);

            const metrics: Record<string, number[]> = {};

            for (let i = 0; i < RenderCount; i++) {
                timer.start('total');
                await renderTile(tileSize);
                timer.end('total');

                const m = timer.metrics;
                if (m == null) {
                    throw new Error('Missing metric');
                }
                for (const key of Object.keys(m)) {
                    const arr = (metrics[key] = metrics[key] || []);
                    arr.push(Number(m[key]));
                }
            }

            results[`${tileSize}x${tileSize}`] = metrics;
        });
    });

    /** Compute the average for the result */
    function computeStats(records: Record<string, number[]>): Record<string, number> {
        const output: Record<string, number> = {};
        for (const key of Object.keys(records)) {
            const values = records[key];
            let total = 0;
            for (const val of values) {
                total += val / NanoSecondToMillisecond;
            }

            output[key] = parseFloat((total / values.length).toFixed(3));
        }
        return output;
    }

    // TODO logging this out is not ideal, we should look into publishing the results of the benchmarks somewhere
    afterAll(() => {
        for (const key of Object.keys(results)) {
            console.log(key, results[key], computeStats(results[key]));
        }
        writeFileSync('./benchmarks.json', JSON.stringify(results, null, 2));
    });
});
