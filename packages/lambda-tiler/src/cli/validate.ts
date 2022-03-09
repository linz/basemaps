import { TileSetType } from '@basemaps/config';
import { GoogleTms } from '@basemaps/geo';
import { Env, fsa, LogConfig, TileSetName } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import pLimit from 'p-limit';
import { TileSets } from '../tile.set.cache.js';
import { TileSetRaster } from '../tile.set.raster.js';

const Q = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

/**
 * CLI to iterate over all imagery sets that have been defined and determine if all the COGS are present and optimized
 */
async function main(): Promise<void> {
  const tileSet = await TileSets.get(TileSetName.aerial, GoogleTms);
  if (tileSet == null) throw new Error('No tile set found');
  if (tileSet.type === TileSetType.Vector) throw new Error('Invalid tile set type');

  let errorCount = 0;
  const logger = LogConfig.get();
  for (const imagery of tileSet.imagery.values()) {
    const path = TileSetRaster.basePath(imagery);
    logger.info({ path, cogs: imagery.files.length }, 'TestingMosaic');

    const promises = imagery.files.map(({ name }) => {
      return Q(async () => {
        try {
          const uri = fsa.source(TileSetRaster.basePath(imagery, name));
          if (uri == null) throw new Error('Failed to load uri: ' + TileSetRaster.basePath(imagery, name));
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
