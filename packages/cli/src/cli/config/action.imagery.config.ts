import { CogTiff } from '@cogeotiff/core';
import { FsAwsS3 } from '@chunkd/source-aws';
import S3 from 'aws-sdk/clients/s3.js';
import { Config, ConfigProviderMemory } from '@basemaps/config';
import { Nztm2000QuadTms, Bounds } from '@basemaps/geo';
import { ulid } from 'ulid';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { fsa, LogConfig } from '@basemaps/shared';

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
    fsa.register('s3://', new FsAwsS3(new S3()));
    const commit = this.commit.value ?? false;

    const sourceFiles = await fsa.toArray(fsa.list(path));
    const tiffs = await Promise.all(
      sourceFiles.filter((f) => f.endsWith('.tif')).map((c) => CogTiff.create(fsa.source(c))),
    );

    if (tiffs.length === 0) throw new Error('Provid path does not have tif imagery.');
    let bounds = null;
    const files = [];
    for (const tif of tiffs) {
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
      const output = fsa.join(path, 'config.json.gz');
      await fsa.writeJson(output, provider.toJson());
    } else {
      logger.info('DryRun:Done');
    }
  }
}
