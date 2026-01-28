import { ConfigImagery, ConfigLayer, ConfigRasterPipeline, ConfigTileSet, ConfigTileSetRaster } from '@basemaps/config';
import { EpsgCode, Nztm2000QuadTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Env, getPreviewUrl } from '@basemaps/shared';
import { Diff } from 'deep-diff';

import { DiffTileSet, DiffTileSetResult, DiffTileSetUpdated, DiffType } from './config.diff.js';

// useful for local testing of the markdown structure
const UsePlaceholderUrls = false;

const PublicUrlBase = Env.isProduction() ? 'https://basemaps.linz.govt.nz/' : 'https://dev.basemaps.linz.govt.nz/';

const EmojiProjection: Partial<Record<EpsgCode, string>> = {
  [EpsgCode.Citm2000]: '🌅',
  [EpsgCode.Google]: '🌏',
  [EpsgCode.Nztm2000]: '🗺️',
  [EpsgCode.Wgs84]: '🌐',
};

export const EmojiChange: Record<DiffType, string> = {
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
export function markdownProjectionLink(projection: EpsgCode, url: URL): string {
  const tileMatrix = projection === EpsgCode.Nztm2000 ? Nztm2000QuadTms : TileMatrixSets.get(projection);

  return `[${markdownProjectionText(projection)}](${UsePlaceholderUrls ? 'url' : url.href} "${tileMatrix.identifier}")`;
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

/**
 * @example `https://dev.basemaps.linz.govt.nz/?c=[config]&i=[tilesetName]&tileMatrix=[tileMatrix]&debug=true`
 *
 * @param configUrl
 * @param configTileset
 * @param tileMatrix
 * @returns
 */
function getTilesetBaseUrl(configUrl: URL, configTileset: ConfigTileSet, tileMatrix: TileMatrixSet): URL {
  const url = new URL(PublicUrlBase); // host
  url.searchParams.set('config', configUrl.href);
  url.searchParams.set('i', configTileset.name); // tileset name
  url.searchParams.set('tileMatrix', tileMatrix.identifier);
  url.searchParams.set('debug', 'true'); // debug mode

  return url;
}

/**
 * @example `https://dev.basemaps.linz.govt.nz/@[location]?c=[config]&i=[layerId]&tileMatrix=[tileMatrix]&debug=true`
 *
 * @param configUrl
 * @param configImagery
 * @returns
 */
function getLayerBaseUrl(configUrl: URL, configImagery: ConfigImagery): URL {
  const center = getPreviewUrl({ imagery: configImagery });

  const url = new URL(PublicUrlBase); // host
  url.pathname = center.slug; // location
  url.searchParams.set('config', configUrl.href);
  url.searchParams.set('i', center.name); // layer id
  url.searchParams.set('tileMatrix', configImagery.tileMatrix);
  url.searchParams.set('debug', 'true'); // debug mode

  return url;
}

/**
 * single-line: no pipelines or one pipeline
 *
 * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
 *
 * multi-line: more than one pipeline
 *
 * @example \n
 * - 🎨 color-ramp:  [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
 * - ⛰️ terrain-rgb: [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
 *
 * @param diff
 * @param tileSet
 * @param layer
 * @param indent
 * @returns
 */
function markdownBasemapsLinks(
  diff: DiffTileSetResult,
  tileSet: ConfigTileSetRaster,
  layer?: ConfigLayer,
  indent = '',
): string {
  const configUrl = diff.after.source;
  if (configUrl == null) throw new Error(`Failed to read config bundled file path. TileSet Id: ${tileSet.id}`);

  const defaultLinks: { [epsg: string]: string } = {};
  const pipelineLinks: { [pipeline: string]: { [format: string]: { [epsg: string]: string } } } = {};

  /**
   * **Stage 1: Build links**
   *
   * First, we iterate over the layer by projection. This gives us access to imagery by layer ID.
   * From that, we can extract each layer's pipelines (outputs) and formats.
   *
   * We don't render markdown yet. Since we're iterating by projections at the top level, generating
   * the markdown inline is tricky. Instead, we only collect the data needed to render the links
   * in the next stage.
   */

  // determine all of the projections for which the tileset's layers define imagery
  const supportedEpsgs: Set<EpsgCode> = new Set();

  for (const layer of tileSet.layers) {
    for (const epsg of ProjectionLinkOrder) {
      const layerId = layer[epsg];
      if (layerId != null) supportedEpsgs.add(epsg);
    }
  }

  for (const epsg of ProjectionLinkOrder.filter((epsg) => supportedEpsgs.has(epsg))) {
    // generate base url
    let baseUrl: URL;

    if (layer != null) {
      const layerId = layer[epsg];
      if (layerId == null) continue;

      const configImagery = diff.after.objects.get(diff.after.Imagery.id(layerId)) as ConfigImagery;
      if (configImagery == null)
        throw new Error(`Failed to find imagery config from config bundle file. Layer Id: ${layerId}`);

      baseUrl = getLayerBaseUrl(configUrl, configImagery);
    } else {
      baseUrl = getTilesetBaseUrl(configUrl, tileSet, TileMatrixSets.get(epsg));
    }

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

        const url = new URL(baseUrl);
        url.searchParams.set('pipeline', pipeline);
        pipelineLinks[output.name]['default'][epsg] = markdownProjectionLink(epsg, url);

        continue;
      }

      // generate links by format
      for (const format of formats.sort((a, b) => a.localeCompare(b))) {
        if (pipelineLinks[output.name][format] == null) pipelineLinks[output.name][format] = {};

        const url = new URL(baseUrl);
        url.searchParams.set('pipeline', pipeline);
        url.searchParams.set('format', format);
        pipelineLinks[output.name][format][epsg] = markdownProjectionLink(epsg, url);
      }
    }
  }

  if (Object.keys(defaultLinks).length === 0 && Object.keys(pipelineLinks).length === 0) {
    throw new Error(`Failed to capture any links. Tileset id: ${tileSet.id}`);
  }

  /**
   * **Stage 2: Render markdown**
   *
   * With the pipelines (outputs) and formats collected, we can generate the markdown efficiently.
   *
   * - If the layer has no pipelines, or, exactly one pipeline, we render a single-line of links.
   * - Otherwise, if the layer has multiple pipelines, we render one line per pipeline.
   */

  /**
   * single-line: no pipelines
   *
   * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
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
   * @example [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
   *
   * multi-line: more than one pipeline
   *
   * @example \n
   * - 🎨 color-ramp:  [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
   * - ⛰️ terrain-rgb: [🌏 WebMercatorQuad]() | [🗺️ NZTM2000Quad]()
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
function markdownDiffRasterLayers(diff: DiffTileSetResult, raster: DiffTileSetUpdated<ConfigTileSetRaster>): string[] {
  if (raster.layers.length === 0) return [];

  const indent = '  ';
  const lines: string[] = [];

  for (const change of raster.layers) {
    const symbol = EmojiChange[change.type];

    if (change.type === 'removed') {
      lines.push(`- #### ${symbol} ${change.before.title} (\`${change.before.name}\`)`);
    } else {
      // Only one layer, that is the same title as this layer
      const showTitle = raster.after.layers.length !== 1 || raster.after.layers[0].title !== raster.after.title;

      if (showTitle) {
        const line: string[] = [];
        line.push(`- #### ${symbol} ${change.after.title}  (\`${change.after.name}\`)`);
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
function markdownDiffRaster(diff: DiffTileSetResult, raster: DiffTileSet<ConfigTileSetRaster>): string {
  const lines: string[] = [];
  const projections = raster.type === 'removed' ? tileSetProjections(raster.before) : tileSetProjections(raster.after);
  const symbol = EmojiChange[raster.type];

  if (raster.type === 'removed') {
    const links = [...projections].map((m) => `~~${markdownProjectionText(m)}~~`);
    lines.push(`#### ${symbol} ${raster.before.title} (\`${raster.id}\`) ` + links.join(' '));
  } else {
    const line: string[] = [];
    line.push(`#### ${symbol} ${raster.after.title} (\`${raster.id}\`)`);
    line.push(markdownBasemapsLinks(diff, raster.after));

    lines.push(line.join(' '));

    // changes
    if (raster.type === 'updated') {
      // Changes to the top level config, eg name or title changes
      for (const change of raster.changes ?? []) {
        lines.push(`\n- ${changeDiff(change)}`);
      }

      const layersMarkdown = markdownDiffRasterLayers(diff, raster);
      if (layersMarkdown.length > 0) {
        lines.push('\n', layersMarkdown.join('\n'));
      }
    }
  }

  return lines.join('');
}

export function diffToMarkdown(diff: DiffTileSetResult): string {
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

  const changesByType: Record<DiffType, DiffTileSet<ConfigTileSetRaster>[]> = {
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

    // ensure a wider gap between tileset listings for clarity
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
