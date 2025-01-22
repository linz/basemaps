import { LogType } from '@basemaps/shared';
import path from 'path';

/**
 * Attempts to extract a map code and version from the filename of the provided filepath.
 * Throws an error if either detail cannot be parsed.
 *
 * @param file: the filepath from which to extract a map code and version.
 *
 * @example
 * file: "s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/CJ10_GRIDLESS_GeoTifv1-00.tif"
 * returns: { mapCode: "CJ10", version: "v1-00" }
 *
 * @returns an object containing the map code and version.
 */
export function extractMapCodeAndVersion(file: string, logger?: LogType): { mapCode: string; version: string } {
  const url = new URL(file);
  const filePath = path.parse(url.href);
  const fileName = filePath.name;

  // extract map code from head of the file name (e.g. CJ10)
  const mapCode = fileName.split('_')[0];
  if (mapCode == null) throw new Error('Map sheet not found in the file name');

  // extract version from tail of the file name (e.g. v1-00)
  const version = fileName.match(/v(\d)-(\d\d)/)?.[0];
  if (version == null) throw new Error('Version not found in the file name');

  logger?.info({ mapCode, version }, 'extractMapCodeAndVersion()');
  return { mapCode, version };
}
