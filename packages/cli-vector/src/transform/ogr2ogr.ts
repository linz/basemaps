import { Epsg } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Command } from '@linzjs/docker-command';

import { Layer } from '../schema-loader/schema.js';

/**
 * ogr2ogr GeoJSONSeq usage, return cmd for ogr2ogr
 *
 * @returns {cmd: string, args: string[]} cmd and arguments for ogr2ogr
 */
export async function ogr2ogrNDJson(input: URL, output: URL, layer: Layer, logger: LogType): Promise<void> {
  const cmd = Command.create('ogr2ogr');

  cmd.args.push('-f', 'GeoJSONSeq');
  cmd.args.push(output.pathname);

  cmd.args.push('-t_srs', Epsg.Wgs84.toEpsgString());
  cmd.args.push(input.pathname);

  const res = await cmd.run();
  if (res.exitCode !== 0) {
    logger.fatal({ Gdal: res }, 'Failure');
    throw new Error('Gdal failed to run');
  }
}

/**
 * ogr2ogr flatgeobuf usage, return cmd for ogr2ogr
 */
export async function ogr2ogrfgb(input: URL, output: URL, logger: LogType): Promise<void> {
  const cmd = Command.create('ogr2ogr');

  // format
  cmd.args.push('-f', 'FlatGeobuf');
  cmd.args.push(output.pathname);

  // spatial reference system
  cmd.args.push('-t_srs', Epsg.Wgs84.toEpsgString());
  cmd.args.push(input.pathname);

  const res = await cmd.run();
  if (res.exitCode !== 0) {
    logger.fatal({ Gdal: res }, 'Failure');
    throw new Error('Gdal failed to run');
  }
}
