import { Epsg, TileMatrixSet } from '@basemaps/geo';
import { LogType, urlToString } from '@basemaps/shared';
import { Command } from '@linzjs/docker-command';
import path, { dirname } from 'path';

import { Layer } from '../schema-loader/schema.js';
import { transformZoom } from './nztm.js';

/**
 * tippecanoe usage, return cmd for tippecanoe
 *
 * @returns { cmd: string; args: string[] } cmd and arguments for tippecanoe docker command
 */
export async function tippecanoe(
  input: URL,
  output: URL,
  layer: Layer,
  tileMatrix: TileMatrixSet,
  logger: LogType,
): Promise<void> {
  const cmd = Command.create('tippecanoe');

  // parallel processing for line-delimited geojson file.
  cmd.args.push('--read-parallel');

  // Config projection
  cmd.args.push('-s', Epsg.Wgs84.toEpsgString());

  // Config detail
  if (layer.style != null) {
    if (layer.style.detail != null) cmd.args.push(`--full-detail=${layer.style.detail}`);
  } else {
    // Default to 0-15 for WebMercator and 0-13 for NZTM2000Quad
    cmd.args.push(`-z${transformZoom(15, tileMatrix)}`);
  }

  cmd.mount(dirname(input.pathname));
  cmd.mount(dirname(output.pathname));
  cmd.args.push('-o', output.pathname);

  // Add tippecanoe options
  if (layer.tippecanoe != null) {
    for (const arg of layer.tippecanoe) {
      cmd.args.push(arg);
    }
  }

  cmd.args.push(input.pathname);
  cmd.args.push('--force');

  const res = await cmd.run();
  logger.debug('tippecanoe ' + cmd.args.join(' '));

  if (res.exitCode !== 0) {
    logger.fatal({ Tippecanoe: res }, 'Failure');
    throw new Error('Tippecanoe Docker failed to run');
  }
}

/**
 * tippecanoe tile-join usage, return cmd for tile-join
 *
 * @returns { cmd: string; args: string[] } cmd and arguments for tippecanoe tile-join docker command
 */
export async function tileJoin(inputs: URL[], output: string, logger: LogType): Promise<void> {
  const cmd = Command.create('tile-join');

  cmd.mount(path.resolve(dirname(output)));

  cmd.args.push('-pk');
  cmd.args.push('-o', output);
  for (const input of inputs) {
    if (input.href.endsWith('mbtiles')) {
      cmd.mount(dirname(urlToString(input)));
      cmd.args.push(urlToString(input));
    }
  }
  cmd.args.push('--force');

  const res = await cmd.run();
  if (res.exitCode !== 0) {
    logger.fatal({ Tippecanoe: res }, 'Failure');
    throw new Error('Tippecanoe Docker failed to run');
  }
}
