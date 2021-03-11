import { GoogleTms } from '@basemaps/geo';
import { Aws, Env, LogConfig, TileSetName } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
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
                    const uri = SourceAwsS3.fromUri(TileSet.basePath(imagery, name), Aws.s3);
                    if (uri == null) throw new Error('Failed to load uri: ' + TileSet.basePath(imagery, name));
                    const source = new CogTiff(uri);
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
