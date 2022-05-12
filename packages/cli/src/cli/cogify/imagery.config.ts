import { Config, ConfigImagery, ConfigTileSet, TileSetType } from '@basemaps/config';
import { ImageFormat } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { CogStacJob } from '../../cog/cog.stac.job';

/**
 * Prepare and insert Imagery Config for the cog creation job.
 * @returns
 */
export async function insertConfigImagery(job: CogStacJob, logger: LogType): Promise<void> {
  const now = Date.now();
  const imgId = Config.Imagery.id(job.id);
  const configImagery: ConfigImagery = {
    id: imgId,
    name: job.name,
    createdAt: now,
    updatedAt: now,
    projection: job.tileMatrix.projection.code,
    uri: job.output.location.path,
    bounds: job.output.bounds,
    files: job.output.files,
  };
  if (Config.Imagery.isWriteable()) Config.Imagery.put(configImagery);
  logger.info({ imgId }, 'CogCreate:InsertConfigImagery');
}

/**
 * Prepare and insert TileSet Config for the cog creation job.
 * @returns
 */
export async function insertConfigTileSet(job: CogStacJob, logger: LogType): Promise<void> {
  const now = Date.now();
  const tsId = Config.TileSet.id(job.id);
  const tileSet: ConfigTileSet = {
    type: TileSetType.Raster,
    format: ImageFormat.Webp,
    id: tsId,
    name: job.name,
    layers: [{ [job.tileMatrix.projection.code]: tsId, name: job.name, minZoom: 0, maxZoom: 32 }],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    createdAt: now,
    updatedAt: now,
  };
  if (Config.TileSet.isWriteable()) Config.TileSet.put(tileSet);
  logger.info({ tsId }, 'CogCreate:InsertConfigTileSet');
}
