import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Metrics } from '@basemaps/metrics';
import { TestTiff } from '@basemaps/test';
import { ImageFormat, Tiler } from '@basemaps/tiler';
import { writeFileSync } from 'fs';
import * as o from 'ospec';
import 'source-map-support/register';
import { TileMakerSharp } from '../index';

o.spec('TileCreationBenchmark', () => {
    const RenderCount = 5;
    const TimeoutSeconds = 30 * 1000;
    const Zoom = 19;

    const Center = 2 ** Zoom;
    const CenterTile = Center / 2;

    const background = { r: 0, g: 0, b: 0, alpha: 1 };

    async function renderTile(tileSize: number, timer: Metrics): Promise<void> {
        const tiler = new Tiler(GoogleTms);
        const tileMaker = new TileMakerSharp(tileSize);

        timer.start('tiff:init');
        const tiff = await TestTiff.Google.init();
        timer.end('tiff:init');

        timer.start('tiler:tile');
        const layers = await tiler.tile([tiff], CenterTile, CenterTile, Zoom);
        timer.end('tiler:tile');

        if (layers == null) throw new Error('Tile is null');
        await tileMaker.compose({ layers, format: ImageFormat.PNG, background });
    }
    const results: Record<string, Record<string, number[]>> = {};

    [256, 512, 1024].forEach((tileSize) => {
        o(`should render ${RenderCount}x${tileSize} tiles`, async () => {
            o.timeout(TimeoutSeconds);
            const metrics: Record<string, number[]> = {};

            for (let i = 0; i < RenderCount; i++) {
                const timer = new Metrics();
                timer.start('total');
                await renderTile(tileSize, timer);
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
                total += val;
            }

            output[key] = parseFloat((total / values.length).toFixed(3));
        }
        return output;
    }

    // TODO logging this out is not ideal, we should look into publishing the results of the benchmarks somewhere
    o.after(() => {
        for (const key of Object.keys(results)) {
            console.log(key, results[key], computeStats(results[key]));
        }
        writeFileSync('./benchmarks.dat', JSON.stringify(results, null, 2));
    });
});
