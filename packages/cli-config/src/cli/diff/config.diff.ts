import {
  ConfigLayer,
  ConfigProviderMemory,
  ConfigTileSet,
  ConfigTileSetRaster,
  ConfigTileSetVector,
  TileSetType,
} from '@basemaps/config';
import diff from 'deep-diff';

import { IgnoredProperties } from '../config.diff.js';

function getAllTileSets(cfg: ConfigProviderMemory): Map<string, ConfigTileSet> {
  const tileSets: Map<string, ConfigTileSet> = new Map();

  for (const obj of cfg.objects.values()) {
    if (!cfg.TileSet.is(obj)) continue;
    if (tileSets.has(obj.id)) throw new Error(`Duplicate tileSet id ${obj.id}`);
    tileSets.set(obj.id, obj);
  }

  return tileSets;
}

function tileSetDiffLayers<T extends ConfigTileSet>(before: T, after: T): Diff<ConfigLayer>[] | null {
  const layerChanges: Diff<ConfigLayer>[] = [];
  const beforeLayers = [...before.layers];

  for (const layer of after.layers) {
    // There are duplicates layers inside the config this makes it hard to know what has changed
    // so only allow comparisons to one layer at a time
    const index = beforeLayers.findIndex((l) => l.name === layer.name);
    if (index > -1) {
      const [el] = beforeLayers.splice(index, 1);
      const layerDiff = diff.diff(el, layer);
      if (layerDiff) layerChanges.push({ type: 'updated', id: el.name, before: el, after: layer, changes: layerDiff });
    } else {
      layerChanges.push({ type: 'new', id: layer.name, after: layer });
    }
  }

  for (const beforeLayer of beforeLayers) {
    layerChanges.push({ type: 'removed', id: beforeLayer.name, before: beforeLayer });
  }

  return layerChanges.length > 0 ? layerChanges : null;
}

function tileSetDiff<T extends ConfigTileSet>(before?: T, after?: T): DiffTileSet<T> | null {
  if (before == null || after == null) {
    if (after != null) return { type: 'new', id: after.id, after };
    if (before != null) return { type: 'removed', id: before.id, before };

    return null;
  }

  // Layers are diffed further down so ignore them from a top level diff
  const topLevelChanges = diff.diff(
    { ...before, layers: undefined },
    { ...after, layers: undefined },
    (_path: string[], key: string) => IgnoredProperties.has(key),
  );

  const layerChanges = tileSetDiffLayers(before, after);
  if (topLevelChanges == null && layerChanges == null) return null;
  return {
    type: 'updated',
    id: before.id,
    before,
    after,
    changes: topLevelChanges as diff.Diff<T>[],
    layers: tileSetDiffLayers(before, after) ?? [],
  };
}

export type DiffTileSetUpdated<T> = DiffUpdated<T> & { layers: Diff<ConfigLayer>[] };
export type DiffTileSet<T> = DiffNew<T> | DiffRemoved<T> | DiffTileSetUpdated<T>;

export interface DiffTileSetResult {
  /** List of raster layers that have changed */
  raster: DiffTileSet<ConfigTileSetRaster>[];
  /** List of vector layers that have changed */
  vector: DiffTileSet<ConfigTileSetVector>[];

  /** Old Configuration that was used for the comparison */
  before: ConfigProviderMemory;
  /** New configuration that was used for the comparison */
  after: ConfigProviderMemory;
}

/**
 * Diff All the tile sets between two configs an out put a summary of the changes
 *
 * @param before the previous configuration
 * @param after  the new configuration
 * @returns
 */
export function configTileSetDiff(before: ConfigProviderMemory, after: ConfigProviderMemory): DiffTileSetResult {
  const tileSetBefore = getAllTileSets(before);
  const tileSetAfter = getAllTileSets(after);

  const seen = new Set<string>();

  const rasterDiffs: DiffTileSet<ConfigTileSetRaster>[] = [];
  const vectorDiffs: DiffTileSet<ConfigTileSetVector>[] = [];

  for (const tsBefore of tileSetBefore.values()) {
    seen.add(tsBefore.id);
    const tsAfter = tileSetAfter.get(tsBefore.id);
    // Changing from raster to vector or vector to raster
    if (tsAfter != null && tsAfter.type !== tsBefore.type) {
      throw new Error(`TileSet type conversion not allowed: ${tsAfter.id} ${tsBefore.type} -> ${tsAfter.type}`);
    }

    if (tsBefore.type === TileSetType.Raster) {
      const diff = tileSetDiff(tsBefore, tsAfter as ConfigTileSetRaster);
      if (diff) rasterDiffs.push(diff);
    } else if (tsBefore.type === TileSetType.Vector) {
      const diff = tileSetDiff(tsBefore, tsAfter as ConfigTileSetVector);
      if (diff) vectorDiffs.push(diff);
    } else {
      throw new Error('Tileset type not supported.');
    }
  }

  for (const tsAfter of tileSetAfter.values()) {
    if (seen.has(tsAfter.id)) continue;

    if (tsAfter.type === TileSetType.Raster) {
      const diff = tileSetDiff(undefined, tsAfter);
      if (diff) rasterDiffs.push(diff);
    } else if (tsAfter.type === TileSetType.Vector) {
      const diff = tileSetDiff(undefined, tsAfter);
      if (diff) vectorDiffs.push(diff);
    } else {
      throw new Error('Tileset type not supported.');
    }
  }

  return { raster: rasterDiffs, vector: vectorDiffs, before, after };
}

export type DiffNew<T> = { type: 'new'; id: string; after: T };
export type DiffRemoved<T> = { type: 'removed'; id: string; before: T };
export type DiffUpdated<T> = { type: 'updated'; id: string; before: T; after: T; changes: diff.Diff<T>[] };
export type Diff<T> = DiffNew<T> | DiffRemoved<T> | DiffUpdated<T>;
export type DiffType = Diff<unknown>['type'];
