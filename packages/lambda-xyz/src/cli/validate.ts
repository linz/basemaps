import pLimit from 'p-limit';
import { Env, LogConfig } from '@basemaps/lambda-shared';
import { TileSet } from '../tile.set';
import { EPSG } from '@basemaps/geo';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';

const Q = pLimit(Env.getNumber(Env.TiffConcurrency, 25));
const bucket = Env.get(Env.CogBucket, undefined);

/**
 * CLI to iterate over all imagery sets that have been defined and determine if all the COGS are present and optimized
 */
async function main(): Promise<void> {
    if (bucket == null || bucket == '') {
        throw new Error(`$${Env.CogBucket} is not defined`);
    }
    const tileSet = new TileSet('aerial', EPSG.Google);
    await tileSet.load();

    let errorCount = 0;
    const logger = LogConfig.get();
    for (const { imagery } of tileSet.allImagery()) {
        const path = TileSet.BasePath(imagery);
        logger.info({ path, quadKeys: imagery.quadKeys.length }, 'TestingMosaic');

        const promises = imagery.quadKeys.map((qk) => {
            return Q(async () => {
                try {
                    const source = new CogTiff(new CogSourceAwsS3(bucket, TileSet.BasePath(imagery, qk)));
                    await source.init();
                    if (!source.options.isCogOptimized) {
                        logger.error({ path, qk }, 'NotOptimized');
                    }
                } catch (e) {
                    logger.error({ err: e, bucket, path, qk }, 'Failed');
                    errorCount++;
                    if (errorCount > 10) {
                        logger.fatal('Too many errors');
                        process.exit(1);
                    }
                }
            });
        });

        await Promise.all(promises);
    }
}

main().catch((err: Error) => LogConfig.get().fatal({ err }, 'Failed'));
