import { BasemapsConfigProvider, ConfigImagery, ConfigTileSet, TileSetType } from '@basemaps/config';
import { ImageFormat } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { CogStacJob } from '../../cog/cog.stac.job';

/**
 * Prepare and insert Imagery Config for the cog creation job.
 * @returns
 */
export async function insertConfigImagery(
  cfg: BasemapsConfigProvider,
  job: CogStacJob,
  logger: LogType,
): Promise<void> {
  const now = Date.now();
  const imgId = cfg.Imagery.id(job.id);
  const configImagery: ConfigImagery = {
    id: imgId,
    name: job.name,
    updatedAt: now,
    projection: job.tileMatrix.projection.code,
    tileMatrix: job.tileMatrix.identifier,
    uri: job.getJobPath(),
    bounds: job.output.bounds,
    files: job.output.files,
  };
  if (cfg.Imagery.isWriteable()) cfg.Imagery.put(configImagery);
  logger.info({ imgId }, 'CogCreate:InsertConfigImagery');
}

/**
 * Prepare and insert TileSet Config for the cog creation job.
 * @returns
 */
export async function insertConfigTileSet(
  cfg: BasemapsConfigProvider,
  job: CogStacJob,
  logger: LogType,
): Promise<void> {
  const now = Date.now();
  const tsId = cfg.TileSet.id(job.id);
  const imId = cfg.Imagery.id(job.id);
  const tileSet: ConfigTileSet = {
    type: TileSetType.Raster,
    format: ImageFormat.Webp,
    id: tsId,
    name: job.id,
    layers: [{ [job.tileMatrix.projection.code]: imId, name: job.id, minZoom: 0, maxZoom: 32 }],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    updatedAt: now,
  };
  if (cfg.TileSet.isWriteable()) cfg.TileSet.put(tileSet);
  logger.info({ tsId }, 'CogCreate:InsertConfigTileSet');
}
