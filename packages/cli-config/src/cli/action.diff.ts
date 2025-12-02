import {
  BaseConfig,
  BasemapsConfigProvider,
  ConfigBundled,
  ConfigId,
  ConfigPrefix,
  ConfigProviderMemory,
  ConfigTileSetVector,
  TileSetType,
} from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Env, fsa, getLogger, logArguments, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, option } from 'cmd-ts';

import { getVectorVersion } from '../util.js';
import { diffVectorUpdate } from './config.diff.js';
import { Q, Updater } from './config.update.js';
import { configTileSetDiff } from './diff/config.diff.js';
import { diffToMarkdown } from './diff/config.diff.markdown.js';

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

    logger.info({ configBefore: args.before.href, configAfter: args.after.href }, 'Import:Load');

    const beforeConfig = await fsa.readJson<ConfigBundled>(args.before);
    const beforeMem = ConfigProviderMemory.fromJson(beforeConfig, args.before);

    const afterConfig = await fsa.readJson<ConfigBundled>(args.after);
    const afterMem = ConfigProviderMemory.fromJson(afterConfig, args.after);

    /**
     * capture raster changes
     */
    const diff = configTileSetDiff(beforeMem, afterMem);
    const rasterMarkdown = diffToMarkdown(diff);

    /**
     * capture vector changes
     *
     * TODO: We have ported the following code from the `import` command
     * to capture vector changes. The following code should be re-worked
     * to follow the new 'diffing' strategy used to capture raster changes.
     */
    afterMem.createVirtualTileSets();

    const promises: Promise<boolean>[] = [];

    /** List of changed configs */
    const changes: BaseConfig[] = [];

    /** List of paths to invalidate at the end of the request */
    const backupConfig: ConfigProviderMemory = new ConfigProviderMemory();

    function update(config: BaseConfig, oldConfig: BasemapsConfigProvider): void {
      const promise = Q(async (): Promise<boolean> => {
        const updater = new Updater(config, oldConfig, false);

        const hasChanges = await updater.reconcile();
        if (hasChanges) {
          changes.push(config);
          const oldData = await updater.getOldData();
          if (oldData != null) backupConfig.put(oldData); // No need to backup anything if there is new insert
        } else {
          backupConfig.put(config);
        }
        return true;
      });

      promises.push(promise);
    }

    logger.info({ after: args.after.href }, 'Import:Start');
    const objectTypes: Partial<Record<ConfigPrefix, number>> = {};

    for (const config of afterMem.objects.values()) {
      const objectType = ConfigId.getPrefix(config.id);
      if (objectType) objectTypes[objectType] = (objectTypes[objectType] ?? 0) + 1;
      update(config, beforeMem);
    }

    await Promise.all(promises);
    logger.info({ objects: afterMem.objects.size, types: objectTypes }, 'Import:Compare:Done');

    logger.info({ markdown: args.output.href }, 'Markdown:Start');
    const vectorMarkdown = await outputChange(afterMem, beforeMem, args.before, changes);

    await fsa.write(args.output, `${rasterMarkdown}\n${vectorMarkdown}`);
    logger.info('Markdown:Done');
  },
});

/**
 * This function compared new config with existing and output a markdown document to highlight the inserts and changes.
 *
 * Changes include:
 * - aerial config
 * - vector config
 * - vector style
 * - individual config
 *
 * @param mem new config data read from config bundle file
 * @param cfg existing config data
 * @param configPath path of config json
 * @param changes list of changed configs
 */
async function outputChange(
  mem: ConfigProviderMemory,
  cfg: BasemapsConfigProvider,
  configPath: URL,
  changes: BaseConfig[],
): Promise<string> {
  // Output for vector config changes
  const outputMarkdown: string[] = [];
  const vectorUpdate = [];
  const styleUpdate = [];

  for (const change of changes) {
    if (mem.TileSet.is(change) && change.type === TileSetType.Vector) {
      vectorUpdate.push(`## Vector data updates for ${change.id}`);
      const id = ConfigId.unprefix(ConfigPrefix.TileSet, change.id);
      const version = getVectorVersion(id);
      if (change.layers[0][2193]) {
        for (const style of VectorStyles) {
          const styleId = version ? `${style}-${version}` : style;
          vectorUpdate.push(
            `* [${style} - NZTM2000Quad](${PublicUrlBase}?config=${configPath.href}&i=${id}&s=${styleId}&p=NZTM2000Quad&debug)\n`,
          );
        }
      }
      if (change.layers[0][3857]) {
        for (const style of VectorStyles) {
          const styleId = version ? `${style}-${version}` : style;
          vectorUpdate.push(
            `* [${style} - WebMercatorQuad](${PublicUrlBase}?config=${configPath.href}&i=${id}&s=${styleId}&p=WebMercatorQuad&debug)\n`,
          );
        }
      }

      const existingTileSet = await cfg.TileSet.get(change.id);
      const featureChanges = await diffVectorUpdate(change, existingTileSet);
      vectorUpdate.push(`## Feature updates for ${change.id}`);
      vectorUpdate.push(...featureChanges);
      const reportMarkdown = await outputAnalyseReports(change);
      if (reportMarkdown.length > 0) vectorUpdate.push(...reportMarkdown);
    }
    if (mem.Style.is(change)) {
      const id = ConfigId.unprefix(ConfigPrefix.Style, change.id);
      const version = getVectorVersion(id);
      const tileSetId = version ? `topographic-${version}` : 'topographic';
      styleUpdate.push(`## Vector Style updated for ${change.id}`);
      const style = ConfigId.unprefix(ConfigPrefix.Style, change.id);
      styleUpdate.push(`* [${style}](${PublicUrlBase}?config=${configPath.href}&i=${tileSetId}&s=${style}&debug)\n`);
    }
  }

  if (styleUpdate.length > 0) outputMarkdown.push('# Vector Style Update', ...styleUpdate);
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
