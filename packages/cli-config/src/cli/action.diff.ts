import { ConfigBundled, ConfigId, ConfigPrefix, ConfigProviderMemory, ConfigTileSetVector } from '@basemaps/config';
import { EpsgCode, GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Env, fsa, getLogger, logArguments, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, option } from 'cmd-ts';

import { getVectorVersion } from '../util.js';
import { diffVectorUpdate } from './config.diff.js';
import { configTileSetDiff, Diff } from './diff/config.diff.js';
import { diffToMarkdown, markdownProjectionLink } from './diff/config.diff.markdown.js';

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
    const vectorMarkdown = await outputChange(afterMem, diff.vector);
    await fsa.write(args.output, `${rasterMarkdown}\n${vectorMarkdown}`);

    logger.info({ markdown: args.output.href }, 'Markdown:Done');
  },
});

/**
 * This function compared new config with existing and output a markdown document to highlight the inserts and changes.
 *
 * @param mem new config data read from config bundle file
 * @param diffs list of changed vector tilesets
 */
async function outputChange(mem: ConfigProviderMemory, diffs: Diff<ConfigTileSetVector>[]): Promise<string> {
  if (mem.source == null) {
    throw new Error('Source URL not set for the new bundled config.');
  }

  // Output for vector config changes
  const outputMarkdown: string[] = [];
  const vectorUpdate = [];

  for (const diff of diffs) {
    if (diff.type === 'updated') {
      const id = ConfigId.unprefix(ConfigPrefix.TileSet, diff.id);
      const version = getVectorVersion(id);

      vectorUpdate.push(`## Vector data updates for \`${id}\``);

      for (const style of VectorStyles) {
        const links: string[] = [];

        for (const projection of [EpsgCode.Google, EpsgCode.Nztm2000]) {
          const styleId = version ? `${style}-${version}` : style;

          const url = new URL(PublicUrlBase);
          url.searchParams.set('config', mem.source.href);
          url.searchParams.set('i', id); // layer id
          url.searchParams.set('style', styleId);
          url.searchParams.set('projection', projection.toString());
          url.searchParams.set('debug', 'true'); // debug mode

          links.push(markdownProjectionLink(projection, url));
        }

        vectorUpdate.push(`- #### ${style}: ${links.join(' | ')}`);
      }

      const featureChanges = await diffVectorUpdate(diff.after, diff.before);

      vectorUpdate.push(`## Feature updates for \`${id}\``);
      vectorUpdate.push(...featureChanges);

      const reportMarkdown = await outputAnalyseReports(diff.after);
      if (reportMarkdown.length > 0) vectorUpdate.push(...reportMarkdown);
    }
    // FIXME: Re-introduce logic for capturing style config changes.
  }

  if (vectorUpdate.length > 0) outputMarkdown.push('# Vector Data Update', ...vectorUpdate);

  return outputMarkdown.join('\n');
}

/**
 * This function prepare for the vector tile analyse reports for markdown output.
 */
async function outputAnalyseReports(change: ConfigTileSetVector): Promise<string[]> {
  const reportMarkdown: string[] = [];
  const layer = change.layers[0];

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
