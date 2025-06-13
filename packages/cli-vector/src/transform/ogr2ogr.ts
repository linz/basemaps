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

  // Calculate area for lake polygons
  if (layer.includeDerived) {
    const table = await getTableName(input, logger);
    cmd.args.push('-dialect', 'SQLite');
    cmd.args.push('-sql', `SELECT *, ST_Area(geom) AS _derived_area FROM "${table}"`);
  }

  cmd.args.push(input.pathname);

  const res = await cmd.run();
  if (res.exitCode !== 0) {
    logger.fatal({ Gdal: res }, 'Failure');
    throw new Error('Gdal failed to run');
  }
}

export async function getTableName(input: URL, logger: LogType): Promise<string> {
  const cmd = Command.create('ogrinfo');

  cmd.args.push('-ro');
  cmd.args.push('-q');
  cmd.args.push('-json');
  cmd.args.push(input.pathname);

  const res = await cmd.run();

  if (res.exitCode !== 0) {
    logger.fatal({ Gdal: res }, 'Failure');
    throw new Error('Gdal failed to run');
  }

  const info = JSON.parse(res.stdout) as { layers: { name: string }[] };
  if (info.layers == null || info.layers.length === 0) {
    throw new Error(`No layers found in ${input.pathname}`);
  }

  return info.layers[0].name; // Return the first layer name
}
