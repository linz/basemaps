import '../imagery';
import { Mosaics } from '../imagery/mosaics';
import pLimit from 'p-limit';
import { Env, LogConfig } from '@basemaps/shared';

const Q = pLimit(Env.getNumber(Env.TiffConcurrency, 25));
const bucket = Env.get(Env.CogBucket, undefined);

/**
 * CLI to iterate over all imagery sets that have been defined and determine if all the COGS are present and optimized
 */
async function main(): Promise<void> {
    if (bucket == null || bucket == '') {
        throw new Error(`$${Env.CogBucket} is not defined`);
    }
    const logger = LogConfig.get();
    for (const cog of Mosaics) {
        cog.bucket = bucket;
        logger.info({ cog: cog.basePath, quadKeys: cog.quadKeys.length }, 'TestingMosaic');

        const promises = cog.quadKeys.map(qk => {
            return Q(async () => {
                try {
                    const source = cog.getSource(qk);
                    await source.init();
                    if (!source.options.isCogOptimized) {
                        logger.error({ cog: cog.basePath, qk }, 'NotOptimized');
                    }
                } catch (e) {
                    logger.error({ err: e, cog: cog.basePath, qk }, 'Failed');
                }
            });
        });

        await Promise.all(promises);
    }
}

main().catch((err: Error) => LogConfig.get().fatal({ err }, 'Failed'));
