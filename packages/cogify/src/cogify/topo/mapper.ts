import { EpsgCode } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Tiff } from '@cogeotiff/core';

import {
  extractBoundsFromTiff,
  extractEpsgFromTiff,
  extractMapCodeAndVersion,
  extractSizeFromTiff,
} from './extract.js';
import { brokenTiffs, ByDirectory, TiffItem } from './types.js';

const slugs: { [key in EpsgCode]?: string } = {
  [EpsgCode.Nztm2000]: 'new-zealand-mainland',
  [EpsgCode.Citm2000]: 'chatham-islands',
};

/**
 * Attempts to map the given EpsgCode enum to a slug.
 *
 * @param epsg: The EpsgCode enum to map to a slug
 *
 * @returns if succeeded, a slug string. Otherwise, null.
 */
export function mapEpsgToSlug(epsg: EpsgCode, logger?: LogType): string | null {
  const slug = slugs[epsg];

  logger?.info({ found: slug != null }, 'mapEpsgToSlug()');
  return slug ?? null;
}

/**
 * Groups a list of Tiff objects into a directory-like structure
 * based on each object's epsg, map code, and version information.
 *
 * This function assigns each tiff to a group based on its map code (e.g. "AT24").
 * For each group, it then identifies the latest version and sets a copy aside. *
 *
 * @param tiffs: the list of Tiff objects to group by epsg, and map code, and version
 * @returns a `ByDirectory<TiffItem>` promise
 */
export function groupTiffsByDirectory(tiffs: Tiff[], logger?: LogType): ByDirectory<TiffItem> {
  // group the tiffs by directory, epsg, and map code
  const byDirectory = new ByDirectory<TiffItem>();

  // create items for each tiff and store them into 'all' by {epsg} and {map code}
  for (const tiff of tiffs) {
    const source = tiff.source.url;
    const { mapCode, version } = extractMapCodeAndVersion(source.href, logger);

    const bounds = extractBoundsFromTiff(tiff);
    const epsg = extractEpsgFromTiff(tiff, logger);
    const size = extractSizeFromTiff(tiff, logger);

    if (bounds == null || epsg == null || size == null) {
      if (bounds == null) {
        brokenTiffs.noBounds.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract bounds from tiff');
      }

      if (epsg == null) {
        brokenTiffs.noEpsg.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract epsg from tiff');
      }

      if (size == null) {
        brokenTiffs.noSize.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract width or height from tiff');
      }

      continue;
    }

    const item = new TiffItem(tiff, source, mapCode, version, bounds, epsg, size);

    // push the item into 'all' by {epsg} and {map code}
    byDirectory.all.get(epsg.toString()).get(mapCode, []).push(item);
  }

  // for each {epsg} and {map code}, identify the latest item by {version} and copy it to 'latest'
  for (const [epsg, byMapCode] of byDirectory.all.entries()) {
    for (const [mapCode, items] of byMapCode.entries()) {
      const sortedItems = items.sort((a, b) => a.version.localeCompare(b.version));

      const latestItem = sortedItems[sortedItems.length - 1];
      if (latestItem == null) throw new Error();

      // store the item into 'latest' by {epsg} and {map code}
      byDirectory.latest.get(epsg).set(mapCode, latestItem);
    }
  }

  logger?.info(
    byDirectory.all.entries().reduce((obj, [epsg, byMapCode]) => {
      return { ...obj, [epsg]: byMapCode.entries().length };
    }, {}),
    'numItemsPerEpsg',
  );

  return byDirectory;
}
