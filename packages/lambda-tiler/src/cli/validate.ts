import { GoogleTms } from '@basemaps/geo';
import { Env, LogConfig, TileSetName } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import pLimit from 'p-limit';
import { TileSet } from '../tile.set';

const Q = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

/**
 * CLI to iterate over all imagery sets that have been defined and determine if all the COGS are present and optimized
 */
async function main(): Promise<void> {
    const tileSet = new TileSet(TileSetName.aerial, GoogleTms);
    await tileSet.load();

    let errorCount = 0;
    const logger = LogConfig.get();
    for (const imagery of tileSet.imagery.values()) {
        const path = TileSet.basePath(imagery);
        logger.info({ path, cogs: imagery.files.length }, 'TestingMosaic');

        const promises = imagery.files.map(({ name }) => {
            return Q(async () => {
                try {
                    const source = new CogTiff(CogSourceAwsS3.createFromUri(TileSet.basePath(imagery, name))!);
                    await source.init();
                    if (!source.options.isCogOptimized) {
                        logger.error({ path, name }, 'NotOptimized');
                    }
                } catch (e) {
                    logger.error({ err: e, path, name }, 'Failed');
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
