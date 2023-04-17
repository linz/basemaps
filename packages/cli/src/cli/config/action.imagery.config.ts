import {
  base58,
  ConfigImagery,
  ConfigJson,
  ConfigProviderMemory,
  ConfigTileSetRaster,
  TileSetType,
} from '@basemaps/config';
import { createImageryGeometry } from '@basemaps/config/src/json/json.config.js';
import { Bounds, ImageFormat, Nztm2000QuadTms } from '@basemaps/geo';
import { fsa, LogConfig, Projection } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ulid } from 'ulid';
import { nameImageryTitle } from '../util.js';

export class CommandImageryConfig extends CommandLineAction {
  private path: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;
  private title: CommandLineStringParameter;

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
    this.title = this.defineStringParameter({
      argumentName: 'TITLE',
      parameterLongName: '--title',
      description: 'Optional title for the config',
      required: true,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'An url written to the output file',
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
    const title = this.title.value;
    if (title == null) throw new Error('Please provide valid a title for the imagery');
    if (!path.endsWith('/')) path += '/';
    const commit = this.commit.value ?? false;
    const output = this.output.value;

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
    let gsd = null;
    const files = [];
    for (const tif of tiffs) {
      await tif.getImage(0).loadGeoTiffTags();
      if (tif.getImage(0).epsg !== Nztm2000QuadTms.projection.code) throw new Error('Imagery is not NZTM Projection.');
      const imgBounds = Bounds.fromBbox(tif.getImage(0).bbox);
      if (gsd == null) gsd = tif.getImage(0).resolution[0];
      if (bounds == null) bounds = imgBounds;
      else bounds = bounds.union(imgBounds);
      files.push({ name: tif.source.uri.replace(path, ''), ...imgBounds });
    }
    if (bounds == null) throw new Error('Failed to extract imagery bounds');

    const provider = new ConfigProviderMemory();
    const id = ulid();
    let name = path.split('/').at(-2);
    if (name == null) {
      logger.warn({ path, id }, `Unable to extract the imagery name from path, use uild id instead.`);
      name = id;
    }
    const geometry = createImageryGeometry(bounds, files, Nztm2000QuadTms);
    const imagery: ConfigImagery = {
      id: provider.Imagery.id(id),
      name: nameImageryTitle(title),
      title,
      updatedAt: Date.now(),
      projection: Nztm2000QuadTms.projection.code,
      tileMatrix: Nztm2000QuadTms.identifier,
      uri: path,
      bounds: bounds.toJson(),
      geometry,
      files,
    };
    imagery.overviews = await ConfigJson.findImageryOverviews(imagery);

    provider.put(imagery);

    const aerialTileSet: ConfigTileSetRaster = {
      id: 'ts_aerial',
      name: 'aerial',
      title: 'Aerial Imagery Basemap',
      category: 'Basemaps',
      type: TileSetType.Raster,
      format: ImageFormat.Webp,
      layers: [{ 2193: imagery.id, name: imagery.name, title: imagery.title }],
    };
    provider.put(aerialTileSet);
    const tileSet = provider.imageryToTileSetByName(imagery);

    // Prepare the center location
    let location = '';
    if (bounds && gsd) {
      const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const proj = Projection.get(Nztm2000QuadTms);
      const centerLatLon = proj.toWgs84([center.x, center.y]).map((c) => c.toFixed(6));
      const targetZoom = Math.max(Nztm2000QuadTms.findBestZoom(gsd) - 12, 0);
      location = `#@${centerLatLon[1]},${centerLatLon[0]},z${targetZoom}`;
    }

    if (commit) {
      logger.info({ path }, 'ImageryConfig:UploadConfig');
      const configJson = provider.toJson();
      const outputPath = fsa.join(path, `basemaps-config-${configJson.hash}.json.gz`);
      await fsa.writeJson(outputPath, configJson);
      const configPath = base58.encode(Buffer.from(outputPath));
      const url = `https://basemaps.linz.govt.nz/?config=${configPath}&i=${tileSet.name}&tileMatrix=NZTM2000Quad&debug${location}`;
      logger.info(
        { path: output, url, tileMatrix: Nztm2000QuadTms.identifier, config: configPath, title },
        'ImageryConfig:Done',
      );
      if (output != null) await fsa.write(output, url);
    } else {
      logger.info('DryRun:Done');
    }
  }
}
