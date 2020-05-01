import * as o from 'ospec';
import { getTileSize, buildCogForQuadKey } from '../cog';
import { GdalCogBuilder } from '../../gdal/gdal';
import { SourceTiffTestHelper } from './source.tiff.testhelper';
import { LogConfig } from '@basemaps/lambda-shared';

LogConfig.disable();

o.spec('cog', () => {
    o.spec('buildCogForQuadKey', () => {
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

            await buildCogForQuadKey(job, '3131033', '/tmp/test.vrt', '/tmp/out-tiff', logger, true);
            o(convertArgs[0].info).equals(logger.info);

            // -projwin 18472078.003508832 -5948635.289265559 18785164.071364917 -6261721.357121641
            // -projwin_srs EPSG:3857
            o(gdalCogBuilder!.config).deepEquals({
                bbox: [18472078.003508832, -5948635.289265559, 18785164.071364917, -6261721.357121641],
                alignmentLevels: 6,
                compression: 'webp',
                resampling: 'cubic',
                blockSize: 512,
            });
            o(gdalCogBuilder!.source).equals('/tmp/test.vrt');
            o(gdalCogBuilder!.target).equals('/tmp/out-tiff');

            o(gdalCogBuilder!.args).deepEquals([
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
                'RESAMPLING=cubic',
                '-co',
                'COMPRESS=webp',
                '-co',
                'ALIGNED_LEVELS=6',
                '-projwin',
                '18472078.003508832',
                '-5948635.289265559',
                '18785164.071364917',
                '-6261721.357121641',
                '-projwin_srs',
                'EPSG:3857',
                '/tmp/test.vrt',
                '/tmp/out-tiff',
            ]);
        });
    });
});
