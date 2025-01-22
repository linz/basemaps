import { TileMatrixSet } from '@basemaps/geo';

import { MapSheetStacItem } from '../types/map-sheet-stac-item.js';
import { TiffItem } from '../types/tiff-item.js';
import { createBaseStacItem } from './create-base-stac-item.js';

/**
 * This function needs to create two groups:
 * - StacItem objects that will live in the "topo[50|250]" directory
 * - StacItem objects that will live in the "topo[50|250]_latest" directory
 *
 * All versions need a StacItem object that will live in the topo[50/250] directory
 * The latest version needs a second StacItem object that will live in the topo[50|250]_latest directory
 */
export function createStacItems(
  allTargetURL: URL,
  tileMatrix: TileMatrixSet,
  all: TiffItem[],
  latest: TiffItem,
): { all: MapSheetStacItem[]; latest: MapSheetStacItem } {
  const allStacItems = all.map((item) => createBaseStacItem(`${item.mapCode}_${item.version}`, item, tileMatrix));

  const latestURL = new URL(`${latest.mapCode}_${latest.version}.json`, allTargetURL);

  // add link to all items pointing to the latest version
  allStacItems.forEach((stacItem) => {
    stacItem.links.push({
      href: latestURL.href,
      rel: 'latest-version',
      type: 'application/json',
    });
  });

  const latestStacItem = createBaseStacItem(latest.mapCode, latest, tileMatrix);

  // add link to the latest item referencing its copy that will live in the topo[50/250] directory
  latestStacItem.links.push({
    href: latestURL.href,
    rel: 'derived_from',
    type: 'application/json',
  });

  return { latest: latestStacItem, all: allStacItems };
}
