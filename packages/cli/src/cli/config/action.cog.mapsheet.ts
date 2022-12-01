import { ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { Bounds } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as fgb from 'flatgeobuf/lib/mjs/geojson.js';
import { FeatureCollection, MultiPolygon } from 'geojson';

interface Output {
  sheetCode: string;
  files: string[];
}

export class CommandCogMapSheet extends CommandLineAction {
  private path: CommandLineStringParameter;
  private config: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private excludes: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'create-mapsheet',
      summary: 'Create a cog mapsheet from provided flatgeobuf',
      documentation: 'Given a valid path of raw imagery and create a config bundle file',
    });
  }

  protected onDefineParameters(): void {
    this.path = this.defineStringParameter({
      argumentName: 'PATH',
      parameterLongName: '--path',
      description: 'Path of flatgeobuf, this can be both a local path or s3 location',
      required: true,
    });
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of basemaps config json, this can be both a local path or s3 location',
      required: true,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Output of the mapsheet file',
      required: true,
    });
    this.excludes = this.defineStringParameter({
      argumentName: 'EXCLUDE',
      parameterLongName: '--excludes',
      description: 'Exclude the layers with the pattern in the layer name.',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const path = this.path.value;
    if (path == null) throw new Error('Please provide valid a fgb path.');
    const config = this.config.value;
    if (config == null) throw new Error('Please provide valid a config path.');

    const excludeStr = this.excludes.value;
    let excludes: string[] = [];
    if (excludeStr) {
      try {
        excludes = JSON.parse(excludeStr);
      } catch {
        throw new Error('Please provide a valid input layer');
      }
    }

    const outputPath = this.output.value;
    if (outputPath == null) throw new Error('Please provide valid a output path.');

    logger.info({ path }, 'MapSheet:LoadFgb');
    const buf = await fsa.read(path);
    logger.info({ config }, 'MapSheet:LoadConfig');
    const configJson = await fsa.readJson<ConfigBundled>(config);
    const men = ConfigProviderMemory.fromJson(configJson);

    const rest = fgb.deserialize(buf) as FeatureCollection;

    const aerial = await men.TileSet.get('ts_aerial');
    if (aerial == null) throw new Error('Invalid config file.');
    const layers = aerial.layers.filter(
      (c) => c[2193] != null && (c.maxZoom == null || c.maxZoom > 19) && (c.minZoom == null || c.minZoom < 32),
    );
    const imageryIds = new Set<string>();
    for (const layer of layers) {
      if (excludes.find((e) => layer.name.includes(e))) continue;
      if (layer[2193] != null) imageryIds.add(layer[2193]);
    }
    const imagery = await men.Imagery.getAll(imageryIds);

    const output: Output[] = [];
    logger.info({ path, config }, 'MapSheet:CreateMapSheet');
    for (const feature of rest.features) {
      if (feature.properties == null) continue;
      const sheetCode = feature.properties.sheet_code_id;
      const current: Output = { sheetCode, files: [] };
      output.push(current);
      const bounds = Bounds.fromMultiPolygon((feature.geometry as MultiPolygon).coordinates);

      for (const layer of layers) {
        if (layer[2193] == null) continue;
        const img = imagery.get(layer[2193]);
        if (img == null) continue;
        if (img.bounds == null || Bounds.fromJson(img.bounds).intersects(bounds)) {
          for (const file of img.files) {
            if (bounds.intersects(Bounds.fromJson(file))) {
              current.files.push(`${img.uri}/${file.name}.tiff`);
            }
          }
        }
      }
    }
    logger.info({ outputPath }, 'MapSheet:WriteOutput');
    fsa.write(outputPath, JSON.stringify(output, null, 2));
  }
}
