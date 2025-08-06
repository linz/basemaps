import { ConfigImagery, ConfigLayer, ConfigTileSet, ConfigTileSetRaster } from '@basemaps/config';
import { EpsgCode, TileMatrixSets } from '@basemaps/geo';
import { getPreviewUrl } from '@basemaps/shared';
import type { Diff } from 'deep-diff';

import { DiffTileSet, DiffTileSetRaster, DiffTileSetRasterUpdated } from './config.diff.js';

const EmojiProjection: Partial<Record<EpsgCode, string>> = {
  [EpsgCode.Nztm2000]: '🗺️',
  [EpsgCode.Google]: '🌏',
};

export const EmojiChange: Record<DiffTileSetRaster['type'], string> = {
  updated: '🔄',
  new: '➕',
  removed: '🗑️',
};

export function formatPath(change: Diff<unknown>): string {
  if (change.path == null || change.path.length === 0) return '';
  return change.path.map((p) => `.${p}`).join('') + ': ';
}

function changeDiff(change: Diff<unknown>): string {
  if (change.kind === 'E') {
    return `🔄 ${formatPath(change)} \`${JSON.stringify(change.lhs)}\` -> \`${JSON.stringify(change.rhs)}\``;
  } else if (change.kind === 'N') {
    return `➕ ${formatPath(change)} \`${JSON.stringify(change.rhs)}\``;
  } else if (change.kind === 'D') {
    return `🗑️ ${formatPath(change)} \`${JSON.stringify(change.lhs)}\``;
  }

  // Array index change
  if (change.kind === 'A') {
    change.item.path = change.path;
    change.item.path?.push(`[${change.index}]`);
    return changeDiff(change.item);
  }

  throw new Error(`Unknown change kind ${JSON.stringify(change)}`);
}

const ProjectionLinkOrder = [EpsgCode.Google, EpsgCode.Nztm2000, EpsgCode.Citm2000];

function markdownProjectionText(projection: EpsgCode): string {
  const tileMatrix = TileMatrixSets.get(projection);

  return `${EmojiProjection[projection] ?? ''} ${tileMatrix.identifier}`;
}

function markdownProjectionLink(projection: EpsgCode, url: string): string {
  return ` [${markdownProjectionText(projection)}](${url})`;
}

function createBasemapsUrl(
  diff: DiffTileSet,
  tileSet: ConfigTileSetRaster,
  layer: ConfigLayer,
  projection: EpsgCode,
): string | null {
  const layerId = layer[projection];
  if (layerId == null) return null;
  const configImagery = diff.after.objects.get(diff.after.Imagery.id(layerId));
  if (configImagery == null) throw new Error(`Failed to find imagery config from config bundle file. Id: ${layerId}`);

  const center = getPreviewUrl({ imagery: configImagery as ConfigImagery });

  return markdownProjectionLink(projection, `https://some-url/${center.url}`);
}

function markdownDiffRasterLayers(diff: DiffTileSet, raster: DiffTileSetRasterUpdated, showLinks = false): string[] {
  if (raster.layers.length === 0) return [];

  const lines: string[] = [];
  const linkProjections = showLinks ? ProjectionLinkOrder : [];

  for (const change of raster.layers) {
    if (change.type === 'removed') {
      lines.push(`- 🗑️ ${change.before.title} (\`${change.before.name}\`)`);
    } else {
      const links = linkProjections
        .map((m) => createBasemapsUrl(diff, raster.after, change.after, m))
        .filter((f) => f != null);

      // Only one layer, that is the same title as this layer
      const showTitle = raster.after.layers.length !== 1 || raster.after.layers[0].title !== raster.after.title;

      if (change.type === 'new') {
        showTitle && lines.push(`- ➕ ${change.after.title}  (\`${change.after.name}\`)` + links.join(' '));
      } else if (change.type === 'updated') {
        showTitle && lines.push(`- 🔄 ${change.after.title}  (\`${change.after.name}\`)` + links.join(' '));

        for (const c of change.changes ?? []) lines.push(`  - ${changeDiff(c)}`);
      }
    }
  }

  return lines;
}

/** Find all the projections from a tileset */
function tileSetProjections(t: ConfigTileSet): EpsgCode[] {
  const projections = new Set<EpsgCode>();
  for (const l of t.layers) {
    if (l['3857']) projections.add(EpsgCode.Google);
    if (l['2193']) projections.add(EpsgCode.Nztm2000);
  }
  return Array.from(projections);
}

function markdownDiffRaster(diff: DiffTileSet, raster: DiffTileSetRaster): string[] {
  const lines: string[] = [];
  const projections = raster.type === 'removed' ? tileSetProjections(raster.before) : tileSetProjections(raster.after);
  if (raster.type === 'removed') {
    const links = [...projections].map((m) => `~~${markdownProjectionText(m)}~~`);
    lines.push(`🗑️ ${raster.before.title} (\`${raster.id}\`) ` + links.join(' '));
  } else {
    const links = [...projections].map((m) => markdownProjectionLink(m, 'FIXME'));
    if (raster.type === 'new') {
      lines.push(`➕ ${raster.after.title} (\`${raster.id}\`)` + links.join(' '));
    } else if (raster.type === 'updated') {
      lines.push(`🔄 ${raster.after.title} (\`${raster.id}\`)` + links.join(' '));

      // Changes to the top level config, eg name or title changes
      for (const change of raster.changes ?? []) {
        lines.push(`- ${changeDiff(change)}`);
      }

      lines.push(...markdownDiffRasterLayers(diff, raster));
    }
  }
  lines.push('\n');
  return lines;
}

export function diffToMarkdown(diff: DiffTileSet): string {
  const lines = [];

  // Aerial layer changes go first
  const aerialLayer = diff.raster.find((l) => l.id === 'ts_aerial');
  if (aerialLayer != null) {
    lines.push('## Aerial layer\n');
    lines.push('One or more changes has been detected on the primary aerial imagery layer\n');
    if (aerialLayer.type === 'removed') {
      lines.push(`# 🚨🚨 "ts_aerial" layer Removed 🚨🚨`);
    } else {
      lines.push(...markdownDiffRaster(diff, aerialLayer));
    }
  }

  const changesByType: Record<DiffTileSetRaster['type'], DiffTileSetRaster[]> = {
    removed: [],
    updated: [],
    new: [],
  };

  for (const raster of diff.raster) {
    // ts_all and ts_aerial are special cases that handled above
    if (raster.id === 'ts_aerial') continue;
    if (raster.id === 'ts_all') continue;
    changesByType[raster.type].push(raster);
  }

  if (changesByType.new.length > 0 || changesByType.removed.length > 0 || changesByType.updated.length) {
    if (lines.length > 0) lines.push('\n');
    lines.push('## Tilesets\n');
  }

  for (const changeType of ['removed', 'updated', 'new'] as const) {
    const changes = changesByType[changeType];
    const e = EmojiChange[changeType];
    if (changes.length > 0) lines.push(`#### ${e} ${changeType.slice(0, 1).toUpperCase()}${changeType.slice(1)} \n`);
    for (const raster of changes) {
      const changed = markdownDiffRaster(diff, raster);
      lines.push(...changed);
    }
  }
  if (lines.length > 0) {
    const configHeader = [`# Configuration changes detected`, '', `**Key**: 🗑️ Deleted 🔄 Updated ➕ New`];
    lines.unshift(configHeader.join('\n') + '\n');
  }

  return lines.join('\n');
}
