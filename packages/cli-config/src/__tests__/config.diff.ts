import { ConfigLayer, ConfigProviderMemory, ConfigTileSetRaster, ConfigTileSetVector } from '@basemaps/config';
import diff from 'deep-diff';

import { IgnoredProperties } from '../cli/config.diff.js';

function getAllTileSets(cfg: ConfigProviderMemory): Map<string, ConfigTileSetRaster> {
  const tileSets: Map<string, ConfigTileSetRaster> = new Map();

  for (const obj of cfg.objects.values()) {
    if (!cfg.TileSet.is(obj)) continue;
    if (tileSets.has(obj.id)) throw new Error(`Duplicate tileSet id ${obj.id}`);
    tileSets.set(obj.id, obj as ConfigTileSetRaster);
  }

  return tileSets;
}

function tileSetDiffRasterLayers(before: ConfigTileSetRaster, after: ConfigTileSetRaster): Diff<ConfigLayer>[] | null {
  const layerChanges: Diff<ConfigLayer>[] = [];
  const beforeLayers = [...before.layers];

  for (const layer of after.layers) {
    // There are duplicates layers inside the config this makes it hard to know what has changed
    // so only allow comparisons to one layer at a time
    const index = beforeLayers.findIndex((l) => l.name === layer.name);
    if (index > -1) {
      const [el] = beforeLayers.splice(index, 1);
      const layerDiff = diff.diff(el, layer);
      if (layerDiff) layerChanges.push({ type: 'changed', before: el, after: layer, changes: layerDiff });
    } else {
      layerChanges.push({ type: 'new', after: layer });
    }
  }

  for (const beforeLayer of beforeLayers) {
    layerChanges.push({ type: 'removed', before: beforeLayer });
  }

  return layerChanges.length > 0 ? layerChanges : null;
}

function tileSetDiffRaster(before?: ConfigTileSetRaster, after?: ConfigTileSetRaster): DiffTileSetRaster | null {
  if (before == null && after == null) return null;
  if (before == null) return { type: 'new', after: after as ConfigTileSetRaster };
  if (after == null) return { type: 'removed', before };

  // Layers are diffed further down so ignore them from a top level diff
  const topLevelChanges = diff.diff(
    { ...before, layers: undefined },
    { ...after, layers: undefined },
    (_path: string[], key: string) => IgnoredProperties.has(key),
  );

  const layerChanges = tileSetDiffRasterLayers(before, after);
  if (topLevelChanges == null && layerChanges == null) return null;
  return {
    type: 'changed',
    before,
    after,
    changes: topLevelChanges as diff.Diff<ConfigTileSetRaster>[],
    layers: tileSetDiffRasterLayers(before, after) ?? [],
  };
}

export type DiffTileSetRasterChanged = DiffChanged<ConfigTileSetRaster> & { layers: Diff<ConfigLayer>[] };
export type DiffTileSetRaster =
  | DiffNew<ConfigTileSetRaster>
  | DiffRemoved<ConfigTileSetRaster>
  | DiffTileSetRasterChanged;

interface DiffTileSet {
  /** List of raster layers that have changed */
  raster: DiffTileSetRaster[];
  /** List of vector layers that have changed */
  vector: Diff<ConfigTileSetVector>[];
}

/**
 * Diff All the tile sets between two configs an out put a summary of the changes
 *
 * @param before the previous configuration
 * @param after  the new configuration
 * @returns
 */
export function configTileSetDiff(before: ConfigProviderMemory, after: ConfigProviderMemory): DiffTileSet {
  const tileSetBefore = getAllTileSets(before);
  const tileSetAfter = getAllTileSets(after);

  const seen = new Set<string>();

  const diffs: DiffTileSetRaster[] = [];

  for (const tsBefore of tileSetBefore.values()) {
    const diff = tileSetDiffRaster(tsBefore, tileSetAfter.get(tsBefore.id));
    seen.add(tsBefore.id);
    if (diff) diffs.push(diff);
  }

  for (const tsAfter of tileSetAfter.values()) {
    if (seen.has(tsAfter.id)) continue;
    const diff = tileSetDiffRaster(undefined, tsAfter);
    if (diff) diffs.push(diff);
  }

  return { raster: diffs, vector: [] };
}

export type DiffNew<T> = { type: 'new'; after: T };
export type DiffRemoved<T> = { type: 'removed'; before: T };
export type DiffChanged<T> = { type: 'changed'; before: T; after: T; changes: diff.Diff<T>[] };
export type Diff<T> = DiffNew<T> | DiffRemoved<T> | DiffChanged<T>;
