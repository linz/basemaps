import { fsa, LogType } from '@basemaps/shared';
import { StacCollection } from 'stac-ts';

import { MapSheetStacItem } from '../types/map-sheet-stac-item.js';

export async function writeStacFiles(
  target: URL,
  items: MapSheetStacItem[],
  collection: StacCollection,
  logger?: LogType,
): Promise<{ itemPaths: { path: URL }[]; collectionPath: URL }> {
  // Create collection json for all topo50-latest items.
  logger?.info({ target }, 'CreateStac:Output');
  logger?.info({ items: items.length, collectionID: collection.id }, 'Stac:Output');

  const itemPaths = [];

  for (const item of items) {
    const itemPath = new URL(`${item.id}.json`, target);
    itemPaths.push({ path: itemPath });

    await fsa.write(itemPath, JSON.stringify(item, null, 2));
  }

  const collectionPath = new URL('collection.json', target);
  await fsa.write(collectionPath, JSON.stringify(collection, null, 2));

  return { itemPaths, collectionPath };
}
