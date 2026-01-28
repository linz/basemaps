import { ConfigBundled, ConfigId, ConfigPrefix, ConfigProviderMemory, ConfigTileSetVector } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Env, fsa, getLogger, logArguments, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, option } from 'cmd-ts';

import { getVectorVersion } from '../util.js';
import { diffVectorUpdate } from './config.diff.js';
import { configTileSetDiff, Diff } from './diff/config.diff.js';
import { diffToMarkdown, EmojiChange, markdownProjectionLink } from './diff/config.diff.markdown.js';

const PublicUrlBase = Env.isProduction() ? 'https://basemaps.linz.govt.nz/' : 'https://dev.basemaps.linz.govt.nz/';

const VectorStyles = ['topographic', 'topolite']; // Vector styles that we want to review if vector data changes.

export const DiffCommand = command({
  name: 'diff',
  version: CliInfo.version,
  description: 'Output the raster and vector differences between two config jsons as a markdown file.',
  args: {
    ...logArguments,
    before: option({
      type: Url,
      long: 'before',
      description: 'Path of config json, this can be both a local path or s3 location',
    }),
    after: option({
      type: Url,
      long: 'after',
      description: 'Path of config json, this can be both a local path or s3 location',
    }),
    output: option({
      type: Url,
      long: 'output',
      description: 'File name and path for saving the markdown file',
    }),
  },

  async handler(args): Promise<void> {
    const logger = getLogger(this, args, 'cli-config');

    logger.info({ configBefore: args.before.href, configAfter: args.after.href }, 'Import:Start');

    const beforeConfig = await fsa.readJson<ConfigBundled>(args.before);
    const beforeMem = ConfigProviderMemory.fromJson(beforeConfig, args.before);

    const afterConfig = await fsa.readJson<ConfigBundled>(args.after);
    const afterMem = ConfigProviderMemory.fromJson(afterConfig, args.after);

    logger.info('Import:Done');

    const diff = configTileSetDiff(beforeMem, afterMem);

    logger.info('Markdown:Start');

    const rasterMarkdown = diffToMarkdown(diff);

    if (afterMem.source == null) throw new Error('Source URL not set for the new bundled config.');
    const vectorMarkdown = await vectorDiffToMarkdown(afterMem.source, diff.vector);

    const combinedMarkdown = [rasterMarkdown, vectorMarkdown].filter((s) => s != null).join('\n');
    await fsa.write(args.output, combinedMarkdown);

    logger.info({ markdown: args.output.href }, 'Markdown:Done');
  },
});

/**
 * Generates markdown for a list of changed vector tilesets.
 *
 * @param configUrl bundled config url
 * @param diffs list of changed vector tilesets
 */
async function vectorDiffToMarkdown(configUrl: URL, diffs: Diff<ConfigTileSetVector>[]): Promise<string | null> {
  if (diffs.length === 0) return null;

  // Output for vector config changes
  const lines: string[] = [];

  lines.push('# Vector Data Update');
  lines.push('## Tilesets');

  for (const diff of diffs) {
    const id = ConfigId.unprefix(ConfigPrefix.TileSet, diff.id);
    const version = getVectorVersion(id);

    const tileMatrices = [GoogleTms];
    if (version != null) tileMatrices.push(Nztm2000QuadTms); // topographic (v1) does not support NZTM2000Quad

    const symbol = EmojiChange[diff.type];
    lines.push(`### ${symbol} ${id}`);

    if (diff.type === 'new' || diff.type === 'updated') {
      // style previews
      for (const style of VectorStyles) {
        const styleId = version ? `${style}-${version}` : style;
        const links: string[] = [];

        for (const tileMatrix of tileMatrices) {
          const url = new URL(PublicUrlBase);
          url.searchParams.set('config', configUrl.href);
          url.searchParams.set('i', id); // layer id
          url.searchParams.set('style', styleId);
          url.searchParams.set('tileMatrix', tileMatrix.identifier);
          url.searchParams.set('debug', 'true'); // debug mode

          links.push(markdownProjectionLink(tileMatrix.projection.code, url));
        }

        lines.push(`- ${styleId}: ${links.join(' | ')}`);
      }

      // feature changes
      const featureChanges = await diffVectorUpdate(diff.after, diff.type === 'new' ? null : diff.before);

      lines.push(`## Feature updates for \`${id}\``);
      lines.push(...featureChanges);

      const reportMarkdown = await outputAnalyseReports(diff.after);
      if (reportMarkdown.length > 0) lines.push(...reportMarkdown);
    }
  }

  // FIXME: Re-introduce logic for capturing style config changes.

  return lines.join('\n');
}

/**
 * Prepares the vector tile analyse reports for markdown output.
 */
async function outputAnalyseReports(diff: ConfigTileSetVector): Promise<string[]> {
  const reportMarkdown: string[] = [];
  const layer = diff.layers[0];

  for (const tms of [GoogleTms, Nztm2000QuadTms]) {
    const layerPath = layer[tms.projection.code];

    if (layerPath == null) continue;
    const reportPath = layerPath.substring(0, layerPath.lastIndexOf('/')) + '/report.md';

    if (await fsa.exists(fsa.toUrl(reportPath))) {
      const reportFile = await fsa.read(fsa.toUrl(reportPath));

      reportMarkdown.push(
        `## Vector Tile Analyse Report for ${tms.identifier}`,
        `<details><summary>🟩 ${tms.identifier}(Click to Expand) 🟩</summary>`,
        reportFile.toString(),
        '</details>\n',
      );
    }
  }

  return reportMarkdown;
}
