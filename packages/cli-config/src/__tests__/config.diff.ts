import { ConfigProviderMemory, ConfigTileSetRaster } from '@basemaps/config';

function getAllTileSets(cfg: ConfigProviderMemory): Map<string, ConfigTileSetRaster> {
  const tileSets: Map<string, ConfigTileSetRaster> = new Map();

  for (const obj of cfg.objects.values()) {
    if (!cfg.TileSet.is(obj)) continue;
    if (tileSets.has(obj.id)) throw new Error(`Duplicate tileSet id ${obj.id}`);
    tileSets.set(obj.id, obj as ConfigTileSetRaster);
  }

  return tileSets;
}

function tileSetDiffRaster(
  before?: ConfigTileSetRaster,
  after?: ConfigTileSetRaster,
): Diff<ConfigTileSetRaster> | null {
  if (before == null && after == null) return null;
  if (before == null) return { type: 'new', after: after as ConfigTileSetRaster };
  if (after == null) return { type: 'removed', before };

  return null;
}

export function configDiff(
  before: ConfigProviderMemory,
  after: ConfigProviderMemory,
): { raster: Diff<ConfigTileSetRaster>[] } {
  const tileSetBefore = getAllTileSets(before);
  const tileSetAfter = getAllTileSets(after);

  const seen = new Set<string>();

  const diffs: Diff<ConfigTileSetRaster>[] = [];

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

  return { raster: diffs };
}

export type DiffNew<T> = { type: 'new'; after: T };
export type DiffRemoved<T> = { type: 'removed'; before: T };
export type DiffChanged<T> = { type: 'changed'; before: T; after: T };
export type Diff<T> = DiffNew<T> | DiffRemoved<T> | DiffChanged<T>;
