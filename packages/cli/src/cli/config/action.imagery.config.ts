import { CogTiff } from '@cogeotiff/core';
import { Config, ConfigBundle, ConfigProviderMemory } from '@basemaps/config';
import { Nztm2000QuadTms, Bounds } from '@basemaps/geo';
import { ulid } from 'ulid';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { fsa, LogConfig, RoleRegister } from '@basemaps/shared';

export class CommandImageryConfig extends CommandLineAction {
  private path: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'create-config',
      summary: 'Create config file from raw tiff imagery',
      documentation: 'Given a valid path of raw imagery and create a config bundle file',
    });
  }

  protected onDefineParameters(): void {
    this.path = this.defineStringParameter({
      argumentName: 'PATH',
      parameterLongName: '--path',
      description: 'Path of raw imagery, this can be both a local path or s3 location',
      required: true,
    });
    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Actually upload the config to s3.',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    let path = this.path.value;
    if (path == null) throw new Error('Please provide valid a path for the imagery');
    if (!path.endsWith('/')) path += '/';
    const commit = this.commit.value ?? false;

    const assumedRole = await RoleRegister.findRole(path);
    if (assumedRole) logger.debug({ path, roleArn: assumedRole?.roleArn }, 'ImageryConfig:AssumeRole');

    logger.info({ path }, 'ImageryConfig:List');
    const sourceFiles = await fsa.toArray(fsa.list(path));
    const tiffs = await Promise.all(
      sourceFiles
        .filter((f) => f.toLocaleLowerCase().endsWith('.tif') || f.toLocaleLowerCase().endsWith('.tiff'))
        .map((c) => CogTiff.create(fsa.source(c))),
    );

    if (tiffs.length === 0) throw new Error('Provided path does not have tif and tiff imagery.');

    logger.info({ path }, 'ImageryConfig:CreateConfig');
    let bounds = null;
    const files = [];
    for (const tif of tiffs) {
      await tif.getImage(0).loadGeoTiffTags();
      if (tif.getImage(0).epsg !== Nztm2000QuadTms.projection.code) throw new Error('Imagery is not NZTM Projection.');
      const imgBounds = Bounds.fromBbox(tif.getImage(0).bbox);
      if (bounds == null) bounds = imgBounds;
      else bounds = bounds.union(imgBounds);
      files.push({
        name: tif.source.uri.replace(path, ''),
        ...imgBounds,
      });
    }

    const provider = new ConfigProviderMemory();
    const id = ulid();
    let name = path.split('/').at(-1);
    if (name == null) {
      logger.warn({ path, id }, `Unable to extract the imagery name from path, use uild id instead.`);
      name = id;
    }
    const imagery = {
      id: Config.Imagery.id(id),
      name,
      updatedAt: Date.now(),
      projection: Nztm2000QuadTms.projection.code,
      tileMatrix: Nztm2000QuadTms.identifier,
      uri: path,
      bounds,
      files,
    };
    provider.put(imagery);

    const tileSet = {
      id: 'ts_aerial',
      name,
      type: 'raster',
      format: 'webp',
      layers: [{ 2193: imagery.id, name: imagery.name, title: imagery.name }],
    };
    provider.put(tileSet);

    if (commit) {
      logger.info({ path }, 'ImageryConfig:UploadConfig');
      const output = fsa.join(path, 'config.json.gz');
      const configJson = provider.toJson();
      await fsa.writeJson(output, configJson);

      logger.info({ hash: configJson.hash }, 'ImageryConfig:ConfigBundle');
      const configBundle: ConfigBundle = {
        id: Config.ConfigBundle.id(configJson.hash),
        name: Config.ConfigBundle.id(`config-${configJson.hash}.json`),
        path: output,
        hash: configJson.hash,
      };

      if (Config.ConfigBundle.isWriteable()) await Config.ConfigBundle.put(configBundle);
    } else {
      logger.info('DryRun:Done');
    }
  }
}
