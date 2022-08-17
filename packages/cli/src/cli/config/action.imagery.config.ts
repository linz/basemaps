import { ConfigProviderMemory } from '@basemaps/config';
import { Bounds, Nztm2000QuadTms } from '@basemaps/geo';
import { Env, fsa, LogConfig, RoleRegister } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ulid } from 'ulid';

export class CommandImageryConfig extends CommandLineAction {
  private path: CommandLineStringParameter;
  private config: CommandLineStringParameter;
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
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Location of a configuration file containing role->bucket mapping information',
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

    const config = this.config.value;
    if (config) {
      logger.info({ path: config }, 'Role:Config');
      process.env[Env.AwsRoleConfigPath] = config;
    }
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
    let name = path.split('/').at(-2);
    if (name == null) {
      logger.warn({ path, id }, `Unable to extract the imagery name from path, use uild id instead.`);
      name = id;
    }
    const imagery = {
      id: provider.Imagery.id(id),
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
      const output = fsa.join(path, 'basemaps-config.json.gz');
      const configJson = provider.toJson();
      await fsa.writeJson(output, configJson);
    } else {
      logger.info('DryRun:Done');
    }
  }
}
