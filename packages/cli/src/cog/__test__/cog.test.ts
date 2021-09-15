import { GoogleTms } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { GdalCogBuilder } from '../../gdal/gdal.cog.js';
import { buildCogForName } from '../cog.js';
import { SourceTiffTestHelper } from './source.tiff.testhelper.js';

LogConfig.disable();

o.spec('cog', () => {
    o.spec('buildCogForName', () => {
        const origConvert = GdalCogBuilder.prototype.convert;

        o.afterEach(() => {
            GdalCogBuilder.prototype.convert = origConvert;
        });

        o('gdal_translate args', async () => {
            let gdalCogBuilder: GdalCogBuilder | null = null;
            let convertArgs: any = null;
            const convert = function (this: any, ...args: any[]): void {
                gdalCogBuilder = this;
                convertArgs = args;
            };
            GdalCogBuilder.prototype.convert = convert as any;

            const job = SourceTiffTestHelper.makeCogJob();
            const logger = LogConfig.get();

            const name = '4-15-10';

            job.output.files = [{ name, ...job.tileMatrix.tileToSourceBounds({ x: 15, y: 10, z: 4 }) }];

            await buildCogForName(job, name, '/tmp/test.vrt', '/tmp/out-tiff', logger, true);
            o(convertArgs[0].info).equals(logger.info);

            const { config } = gdalCogBuilder!;
            config.bbox = round(config.bbox, 4);
            config.targetRes = round(config.targetRes, 4);

            o(config).deepEquals({
                bbox: [17532819.7999, -5009377.0857, 20037508.3428, -7514065.6285],
                alignmentLevels: 13,
                compression: 'webp',
                tileMatrix: GoogleTms,
                resampling: { warp: 'bilinear', overview: 'lanczos' },
                blockSize: 512,
                targetRes: 0.75,
                quality: 90,
            });
            o(gdalCogBuilder!.source).equals('/tmp/test.vrt');
            o(gdalCogBuilder!.target).equals('/tmp/out-tiff');

            o(round(gdalCogBuilder!.args, 4)).deepEquals([
                '-of',
                'COG',
                '-co',
                'TILING_SCHEME=GoogleMapsCompatible',
                '-co',
                'NUM_THREADS=ALL_CPUS',
                '-co',
                'BIGTIFF=YES',
                '-co',
                'ADD_ALPHA=YES',
                '-co',
                'BLOCKSIZE=512',
                '-co',
                'WARP_RESAMPLING=bilinear',
                '-co',
                'OVERVIEW_RESAMPLING=lanczos',
                '-co',
                'COMPRESS=webp',
                '-co',
                'ALIGNED_LEVELS=13',
                '-co',
                'QUALITY=90',
                '-co',
                'SPARSE_OK=YES',
                '-tr',
                '0.75',
                '0.75',
                '-projwin',
                '17532819.7999',
                '-5009377.0857',
                '20037508.3428',
                '-7514065.6285',
                '-projwin_srs',
                'EPSG:3857',
                '/tmp/test.vrt',
                '/tmp/out-tiff',
            ]);
        });
    });
});
