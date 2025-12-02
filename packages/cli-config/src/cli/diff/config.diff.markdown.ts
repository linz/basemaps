import { ConfigImagery, ConfigLayer, ConfigRasterPipeline, ConfigTileSet, ConfigTileSetRaster } from '@basemaps/config';
import { EpsgCode, TileMatrixSets } from '@basemaps/geo';
import { Env, fsa, getPreviewUrl } from '@basemaps/shared';
import type { Diff } from 'deep-diff';

import { DiffTileSet, DiffTileSetRaster, DiffTileSetRasterUpdated } from './config.diff.js';

// useful for local testing of the markdown structure
const UsePlaceholderUrls = false;

const PublicUrlBase = Env.isProduction() ? 'https://basemaps.linz.govt.nz/' : 'https://dev.basemaps.linz.govt.nz/';

const EmojiProjection: Partial<Record<EpsgCode, string>> = {
  [EpsgCode.Citm2000]: '🌅',
  [EpsgCode.Google]: '🌏',
  [EpsgCode.Nztm2000]: '🗺️',
  [EpsgCode.Wgs84]: '🌐',
};

export const EmojiChange: Record<DiffTileSetRaster['type'], string> = {
  updated: '🔄',
  new: '➕',
  removed: '🗑️',
};

const EmojiPipeline: Record<ConfigRasterPipeline['type'], string> = {
  'color-ramp': '🎨',
  extract: '🌈',
  ndvi: '🌱',
  'terrain-rgb': '⛰️',
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

/**
 * @example 🌏
 * @example "WebMercatorQuad"
 *
 * @param projection
 * @returns
 */
function markdownProjectionText(projection: EpsgCode): string {
  const tileMatrix = TileMatrixSets.get(projection);

  return EmojiProjection[projection] ?? tileMatrix.identifier;
}

/**
 * @example [🌏](https://... "WebMercatorQuad")
 *
 * @param projection
 * @param url
 * @returns
 */
function markdownProjectionLink(projection: EpsgCode, url: URL): string {
  const tileMatrix = TileMatrixSets.get(projection);

  return `[${markdownProjectionText(projection)}](${UsePlaceholderUrls ? 'url' : url} "${tileMatrix.identifier}")`;
}

/**
 * @example 🎨
 * @example ⛰️
 *
 * @param type
 * @returns
 */
function markdownPipelineText(type: ConfigRasterPipeline['type']): string {
  return `${EmojiPipeline[type]} ${type === 'extract' ? 'rgb' : type}`;
}

function getBaseUrl(configUrl: URL, epsg: EpsgCode, configImagery: ConfigImagery): URL {
  const center = getPreviewUrl({ imagery: configImagery });
  const location = `${center.location.lat},${center.location.lon},z${center.location.zoom}`;
  const queries = `c=${configUrl.href}&i=${center.name}&p=${epsg.toString()}&debug=true`;

  return fsa.toUrl(`${PublicUrlBase}@${location}?${queries}`);
}

/**
 * single-line: one pipeline
 *
 * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
 *
 * multi-line: more than one pipeline
 *
 * @example \n
 * - 🎨 color-ramp:  [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
 * - ⛰️ terrain-rgb: [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
 *
 * @param diff
 * @param tileSet
 * @param layer
 * @returns
 */
function markdownBasemapsLinks(
  diff: DiffTileSet,
  tileSet: ConfigTileSetRaster,
  layer: ConfigLayer,
  indent = '',
): string {
  const configUrl = diff.after.source;
  if (configUrl == null) throw new Error(`Failed to read config bundled file path. TileSet Id: ${tileSet.id}`);

  const defaultLinks: { [epsg: string]: string } = {};
  const pipelineLinks: { [pipeline: string]: { [format: string]: { [epsg: string]: string } } } = {};

  // grab layer by epsg
  for (const epsg of ProjectionLinkOrder) {
    const layerId = layer[epsg];
    if (layerId == null) continue;

    // grab imagery config
    const configImagery = diff.after.objects.get(diff.after.Imagery.id(layerId));
    if (configImagery == null) throw new Error(`Failed to find imagery config from config bundle file. Id: ${layerId}`);

    const baseUrl = getBaseUrl(configUrl, epsg, configImagery as ConfigImagery);

    // grab outputs
    const outputs = tileSet.outputs;

    if (outputs == null) {
      defaultLinks[epsg] = markdownProjectionLink(epsg, baseUrl);
      continue;
    }

    // generate links by output
    for (const output of outputs.sort((a, b) => a.name.localeCompare(b.name))) {
      const pipeline = output.name as ConfigRasterPipeline['type'];
      if (pipelineLinks[pipeline] == null) pipelineLinks[pipeline] = {};

      const formats = output.format;

      if (formats == null) {
        if (pipelineLinks[pipeline]['default'] == null) pipelineLinks[pipeline]['default'] = {};

        const url = fsa.toUrl(`${baseUrl.href}&pipeline=${pipeline}`);
        pipelineLinks[output.name]['default'][epsg] = markdownProjectionLink(epsg, url);

        continue;
      }

      // generate links by format
      for (const format of formats.sort((a, b) => a.localeCompare(b))) {
        if (pipelineLinks[output.name][format] == null) pipelineLinks[output.name][format] = {};

        const url = fsa.toUrl(`${baseUrl.href}&pipeline=${pipeline}&format=${format}`);
        pipelineLinks[output.name][format][epsg] = markdownProjectionLink(epsg, url);
      }
    }
  }

  /**
   * single-line: no pipelines
   *
   * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
   */
  if (Object.keys(defaultLinks).length > 0) {
    const line: string[] = [];

    for (const epsg of ProjectionLinkOrder) {
      if (defaultLinks[epsg] == null) continue;

      const link = defaultLinks[epsg];
      line.push(link);
    }

    return line.join(' | ');
  }

  /**
   * single-line: one pipeline
   *
   * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
   *
   * multi-line: more than one pipeline
   *
   * @example \n
   * - 🎨 color-ramp:  [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
   * - ⛰️ terrain-rgb: [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
   */
  const numPipelines = Object.keys(pipelineLinks).length;
  const lines: string[] = [];

  for (const [pipeline, byFormat] of Object.entries(pipelineLinks)) {
    const line: string[] = [];

    if (numPipelines > 1) {
      line.push(`\n${indent}- ${markdownPipelineText(pipeline as ConfigRasterPipeline['type'])}:`);
    }

    const numFormats = Object.keys(byFormat).length;

    for (const [format, byEpsg] of Object.entries(byFormat)) {
      const links: string[] = [];

      for (const epsg of ProjectionLinkOrder) {
        if (byEpsg[epsg] == null) continue;

        const link = byEpsg[epsg];

        if (numFormats > 1 && format !== 'default') {
          links.push(`${link} \`${format}\``);
        } else {
          links.push(link);
        }
      }

      line.push(links.join(' | '));
    }

    lines.push(line.join(' '));
  }

  return lines.join('');
}

/**
 * Generates markdown for the given Tileset's Layers.
 *
 * @param diff
 * @param raster
 * @returns
 */
function markdownDiffRasterLayers(diff: DiffTileSet, raster: DiffTileSetRasterUpdated): string[] {
  if (raster.layers.length === 0) return [];

  const indent = '  ';
  const lines: string[] = [];

  for (const change of raster.layers) {
    if (change.type === 'removed') {
      lines.push(`- 🗑️ ${change.before.title} (\`${change.before.name}\`)`);
    } else {
      // Only one layer, that is the same title as this layer
      const showTitle = raster.after.layers.length !== 1 || raster.after.layers[0].title !== raster.after.title;

      if (showTitle) {
        const line: string[] = [];

        // title
        const symbol = change.type === 'new' ? '➕' : '🔄';
        line.push(`- #### ${symbol} ${change.after.title}  (\`${change.after.name}\`)`);

        // links
        line.push(markdownBasemapsLinks(diff, raster.after, change.after, indent));

        lines.push(line.join(' '));
      }

      // changes
      if (change.type === 'updated') {
        for (const c of change.changes) lines.push(`${indent}- ${changeDiff(c)}`);
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

/**
 * Generates markdown for the given Tileset.
 *
 * @param diff
 * @param raster
 * @returns
 */
function markdownDiffRaster(diff: DiffTileSet, raster: DiffTileSetRaster): string {
  const lines: string[] = [];
  const projections = raster.type === 'removed' ? tileSetProjections(raster.before) : tileSetProjections(raster.after);

  if (raster.type === 'removed') {
    const links = [...projections].map((m) => `~~${markdownProjectionText(m)}~~`);
    lines.push(`🗑️ ${raster.before.title} (\`${raster.id}\`) ` + links.join(' '));
  } else {
    const line: string[] = [];

    /**
     * title
     *
     * @example 🔄 Aerial Imagery Basemap (ts_aerial)
     */
    const symbol = raster.type === 'new' ? '➕' : '🔄';
    line.push(`#### ${symbol} ${raster.after.title} (\`${raster.id}\`)`);

    /**
     * links
     *
     * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
     */
    line.push(markdownBasemapsLinks(diff, raster.after, raster.after.layers[0]));

    /**
     * line
     *
     * @example 🔄 Aerial Imagery Basemap (ts_aerial) [🌏 WebMercatorQuad]() | [🗺️ NZTM2000]()
     */
    lines.push(line.join(' '));

    // changes
    if (raster.type === 'updated') {
      // Changes to the top level config, eg name or title changes
      for (const change of raster.changes ?? []) {
        lines.push(`- ${changeDiff(change)}`);
      }

      const layersMarkdown = markdownDiffRasterLayers(diff, raster);

      if (layersMarkdown.length > 0) {
        lines.push('\n', layersMarkdown.join('\n'));
      }
    }
  }

  return lines.join('');
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
      lines.push(markdownDiffRaster(diff, aerialLayer));
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
    if (changes.length > 0) lines.push(`### ${e} ${changeType.slice(0, 1).toUpperCase()}${changeType.slice(1)} \n`);

    const linesByTileset: string[] = [];

    for (const raster of changes) {
      linesByTileset.push(markdownDiffRaster(diff, raster));
    }

    lines.push(linesByTileset.join('\n\n<br />\n\n'));
  }

  // FIXME: todo add simple vector diff +
  // IF vector layer has changed
  /*
        const featureChanges = await diffVectorUpdate(change, existingTileSet);
      vectorUpdate.push(`## Feature updates for ${change.id}`);
      vectorUpdate.push(...featureChanges);
      const reportMarkdown = await outputAnalyseReports(change);
      */

  if (lines.length > 0) {
    const configHeader = [`# Configuration changes detected`, '', `**Key**: ➕ New | 🔄 Updated | 🗑️ Deleted`];
    lines.unshift(configHeader.join('\n') + '\n');
  }

  return lines.join('\n');
}
