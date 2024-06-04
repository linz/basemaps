import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, oneOf, option, optional } from 'cmd-ts';

import { getLogger, logArguments } from '../../log.js';
import { Url } from '../parsers.js';
import { GoogleTms, Nztm2000QuadTms, StacCatalog } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import path from 'path';

const bucket = 's3://nz-elevation/';
const catalogPath = new URL('catalog.json', bucket);

export const BasemapsCogifyElevationCommand = command({
  name: 'cogify-elevation',
  version: CliInfo.version,
  description: 'Validate elevation changes and output the sources that need to update.',
  args: {
    ...logArguments,
    config: option({
      type: optional(Url),
      long: 'config',
      description: 'Basemaps config location to compare, import all elevation in not provided.',
    }),
    type: option({
      type: oneOf(['dem_1m', 'dsm_1m']),
      long: 'type',
      description: 'Type of elevation data to import',
      defaultValue: () => 'dem',
    }),
    tileMatrix: option({
      type: oneOf([GoogleTms.identifier, Nztm2000QuadTms.identifier]),
      long: 'tile-matrix',
      description: `Output TileMatrix to use.`,
    }),
    output: option({
      type: optional(Url),
      long: 'output',
      description: 'Output the source elevation paths that need to import',
    }),
  },

  async handler(args) {
    const logger = getLogger(this, args);
    const importAll = args.config == undefined;
    const sources: string[] = [];
    // const output: string[] = [];

    logger.info({ catalog: catalogPath, config: args.config }, 'Elevation:LoadCatalog');
    const catalog = await fsa.readJson<StacCatalog>(catalogPath);
    for (const link of catalog.links) {
      if (link.rel !== 'child') continue;
      if (link.href.includes(args.type)) {
        const dirname = path.dirname(link.href);
        const source = new URL(dirname, bucket);
        const splits = link.href.split('/');
        const region = splits[1];
        const name = splits[2];
        if (importAll) sources.push(source.href);
        const args = [
          `argo submit --from wftmpl/basemaps-imagery-import-cogify`,
          `-n argo`,
          `--generate-name basemaps-elevation-import-${name.replace('_','-')}`,
          `-p version_basemaps_cli="latest"`,
          `-p preset="lerc_10mm"`,
          `-p region="${region}"`,
          `-p source="${source.href}/"`,
          `-p create_pull_request="none"`,
          `-p category="Elevation"`,
          `-p target="s3://linz-basemaps/"`,
          `-p tile_matrix="WebMercatorQuad"`,
          `-p cutline=""`,
          `-p create_overview="false"`,
        ];
        console.log(args.join(' '));
      }
    }
    
    if (args.output) fsa.write(args.output, JSON.stringify(sources));
  },
});
