import { ConfigTileSet } from '@basemaps/config';
import { Epsg, StacCollection, StacLink } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import c from 'ansi-colors';
import diff from 'deep-diff';

export const IgnoredProperties = new Set(['id', 'createdAt', 'updatedAt', 'year', 'resolution']);

interface StacLinkLds extends StacLink {
  'lds:id': string;
  'lds:name': string;
  'lds:feature_count': number;
  'lds:version': string;
}

export class ConfigDiff {
  static getDiff<T>(changes: diff.Diff<T, T>[]): string {
    let output = '';
    let isArray = false;
    for (const change of changes) {
      if (change.kind === 'A') {
        if (change.path) output += change.path.join();
        output += this.getDiff([change.item]);
        isArray = true; // Stop displaying the array changes for each line.
      } else {
        if (isArray) continue;
        if (change.kind === 'E') {
          if (change.path) output += change.path.join();
          output += c.green('\t+' + JSON.stringify(change.rhs));
          output += c.red('\t-' + JSON.stringify(change.lhs)) + '\n';
        } else if (change.kind === 'N') {
          if (change.path) output += change.path.join();
          output += c.green('\t+' + JSON.stringify(change.rhs)) + '\n';
        } else if (change.kind === 'D') {
          if (change.path) output += change.path.join();
          output += c.red('\t-' + JSON.stringify(change.lhs)) + '\n';
        }
      }
    }
    return output;
  }

  static showDiff<T extends { id: string; name: string }>(
    type: string,
    oldData: T,
    newData: T,
    logger: LogType,
  ): boolean {
    const changes = diff.diff(oldData, newData, (_path: string[], key: string) => IgnoredProperties.has(key));
    if (changes) {
      const changeDif = ConfigDiff.getDiff(changes);
      logger.info({ type, record: newData.id, description: newData.name }, 'Changes');
      // eslint-disable-next-line no-console
      console.log(newData.id, newData.name);
      // eslint-disable-next-line no-console
      console.log(changeDif);

      return true;
    }
    return false;
  }
}

/**
 * Given a old and new lds layer stac item and log the changes
 */
export function getVectorChanges(newLayer: StacLink | undefined, existingLayer: StacLink | undefined): string | null {
  // Update Layer
  if (newLayer != null && existingLayer != null) {
    const featureChange = Number(newLayer['lds:feature_count']) - Number(existingLayer['lds:feature_count']);

    if (newLayer['lds:version'] === existingLayer['lds:version'] && featureChange !== 0) {
      // Alert if feature changed with no version bump.
      return `🟥🟥🟥🟥 Feature Change Detected ${newLayer['lds:name']} - version: ${newLayer['lds:version']} features: ${newLayer['lds:feature_count']} (+${featureChange}) 🟥🟥🟥🟥`;
    } else if (newLayer['lds:version'] === existingLayer['lds:version']) return null;

    if (featureChange >= 0) {
      // Add Features
      return `🟦 ${newLayer['lds:name']} - version: ${newLayer['lds:version']} (from: ${existingLayer['lds:version']}) features: ${newLayer['lds:feature_count']} (+${featureChange})`;
    } else {
      // Remove Features
      return `🟧 ${newLayer['lds:name']} - version: ${newLayer['lds:version']} (from: ${existingLayer['lds:version']}) features: ${newLayer['lds:feature_count']} (-${featureChange})`;
    }
  }

  // Add new Layer
  if (newLayer != null && existingLayer == null) {
    return `🟩 ${newLayer['lds:name']} - version: ${newLayer['lds:version']} features: ${newLayer['lds:feature_count']}`;
  }

  // Remove Layer
  if (newLayer == null && existingLayer != null) {
    return `🟥 ${existingLayer['lds:name']} features: -${existingLayer['lds:feature_count']}`;
  }

  // No changes detected return null
  return null;
}

/**
 * Prepare and create pull request for the aerial tileset config
 */
export async function diffVectorUpdate(
  tileSet: ConfigTileSet,
  existingTileSet: ConfigTileSet | null,
): Promise<string[]> {
  // Vector layer only support for 3857 and only contain on layer inside
  const changes: string[] = [];
  const layer = tileSet.layers[0];
  if (layer?.[Epsg.Google.code] == null) throw new Error(`Invalid layers in the vector tileSet ${tileSet.id}`);
  const newCollectionPath = new URL('collection.json', layer[Epsg.Google.code]);
  const newCollection = await fsa.readJson<StacCollection>(newCollectionPath);
  if (newCollection == null) throw new Error(`Failed to get target collection json from ${newCollectionPath}.`);
  const ldsLayers = newCollection.links.filter((f) => f.rel === 'lds:layer') as StacLinkLds[];

  // Log all the new inserts for new tileset
  if (existingTileSet == null) {
    for (const l of ldsLayers) {
      const change = getVectorChanges(l, undefined);
      if (change != null) changes.push(change);
    }
    return changes;
  }

  // Compare the different of existing tileset, we usually only have one layers in the vector tiles, so the loop won't fetch very much
  for (const l of existingTileSet.layers) {
    if (l[Epsg.Google.code] == null) continue;
    if (l.name !== layer.name) continue;
    const existingCollectionPath = new URL('collection.json', l[Epsg.Google.code]);
    const existingCollection = await fsa.readJson<StacCollection>(existingCollectionPath);
    if (existingCollection == null) {
      throw new Error(`Failed to get target collection json from ${existingCollectionPath}.`);
    }

    // Prepare existing lds layers as map
    const existingLdsLayers = new Map<string, StacLinkLds>();
    for (const item of existingCollection.links) {
      if (item.rel === 'lds:layer') existingLdsLayers.set((item as StacLinkLds)['lds:id'], item as StacLinkLds);
    }

    // Find layer updates
    for (const l of ldsLayers) {
      const existingLayer = existingLdsLayers.get(l['lds:id']);
      const change = getVectorChanges(l, existingLayer);
      if (change != null) changes.push(change);
      if (existingLayer != null) existingLdsLayers.delete(l['lds:id']);
    }

    // Remove the layers that not deleted from existingLdsLayers
    for (const l of existingLdsLayers.values()) {
      const change = getVectorChanges(l, undefined);
      if (change != null) changes.push(change);
    }
  }

  return changes;
}
