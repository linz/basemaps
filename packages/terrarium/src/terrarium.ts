import { Bounds, Epsg, GoogleTms, Nztm2000Tms, TileMatrixSet } from '@basemaps/geo';
import { fsa } from '@chunkd/fs';
import { CogTiff, TiffTag } from '@cogeotiff/core';
import Sharp from 'sharp';
import { Gdal } from '@basemaps/cli';
import type { Limit } from 'p-limit';
import PLimit from 'p-limit';
import * as os from 'os';
import { basename } from 'path';
import { LogType } from '@basemaps/shared';

interface TerrariumMakerContext {
  /** unique id for this build */
  id: string;
  /** Source netcdf or tiff file path */
  inputPath: string;
  /** Output directory path */
  outputPath: string;
  tmpFolder: string;
  /** TileMatrixSet to cut the bathy up into tiles */
  tileMatrix: TileMatrixSet;
  /** zoom level of the tms to cut the tiles too */
  zoom: number;
  /** Number of threads used to convert @default NUM_CPUS */
  threads?: number;
}

export class TerrariumMaker {
  config: TerrariumMakerContext;
  logger: LogType;

  /** Current gdal version @see Gdal.version */
  gdalVersion: Promise<string>;
  /** Concurrent limiting queue, all work should be done inside the queue */
  q: Limit;

  constructor(ctx: TerrariumMakerContext, logger: LogType) {
    this.config = ctx;
    this.logger = logger;
    this.q = PLimit(this.config.threads ? this.config.threads : os.cpus().length);
  }

  async render(): Promise<string> {
    const terrrirumTiffs: string[] = [];
    // Load all tiffs in DEM folder and covert to terrriaum png
    for await (const fileName of fsa.list(this.config.inputPath)) {
      if (!fileName.endsWith('.tif')) continue;
      terrrirumTiffs.push(await this.convert(fileName));
    }

    // build all terriaum tiff as vrt file
    const tmpVrtPath = await this.buildVrt(terrrirumTiffs);

    // Convert vrt to cog
    const output = await this.buildCog(tmpVrtPath);
    return output;
  }

  async convert(fileName: string): Promise<string> {
    const baseName = basename(fileName); ///.split('/').pop();
    this.logger.info({ baseName }, 'Convert DEM tiff');
    // Create a COG source
    const source = fsa.source(fileName);
    const tiff = new CogTiff(source);
    await tiff.init();
    const img = tiff.getImage(0);

    // load no data value
    let noData: number | null = null;
    const noDataTag = img.tags.get(TiffTag.GDAL_NODATA);
    if (noDataTag != null) {
      noData = Number(String(noDataTag.readValue()).replace('\x00', ''));
      this.logger.info({ noData }, 'NoData:Found');
    }
    const size = img.size;
    const outBuf = Buffer.alloc(4 * size.width * size.height);
    for (let stripI = 0; stripI < img.stripCount; stripI++) {
      const strip = await img.getStrip(stripI);
      if (strip == null || strip.mimeType !== 'application/octet-stream') throw new Error('Unknown type');

      const buf = Buffer.from(strip.bytes);
      for (let bufI = 0; bufI < buf.length; bufI += 4) {
        const offset = bufI + stripI * (size.width * 4);
        const floatVal = buf.readFloatLE(bufI); // TODO what if its not a float32
        // Imagery is already full alpha'd
        if (floatVal === noData) continue;

        // Magic converting Math
        const v = floatVal + 32768;
        outBuf.writeUInt8(Math.floor(v / 256), offset); // Red
        outBuf.writeUInt8(Math.floor(v % 256), offset + 1); // Green
        outBuf.writeUInt8(Math.floor((v - Math.floor(v)) * 256), offset + 2); // Blue
        outBuf.writeUInt8(255, offset + 3); // Alpha
      }
    }

    // Convert RAW Imagery bytes into PNG
    const png = `${this.config.tmpFolder}/${baseName}.png`;
    await Sharp(outBuf, { raw: { channels: 4, width: size.width, height: size.height } })
      .png()
      .toFile(png);
    source.close ? await source.close() : undefined;

    const [image] = tiff.images;
    await image.loadGeoTiffTags(this.logger);

    const bounds = Bounds.fromBbox(image.bbox);
    const epsg = Epsg.parse(String(image.epsg));
    if (epsg == null) throw new Error('No EPSG');

    return await this.buildTerrarium(png, epsg, bounds);
  }

  async buildTerrarium(input: string, epsg: Epsg, bounds: Bounds): Promise<string> {
    const output = `${this.config.tmpFolder}/${basename(input)}.terrarium.tiff`;

    this.logger.info({ input, output }, 'Build Terrarium');
    const gdal = Gdal.create();
    if (gdal.mount != null) gdal.mount(this.config.tmpFolder);

    await gdal.run(
      'gdal_translate',
      [
        '-of',
        'VRT',
        // '-co',
        // 'NUM_THREADS=ALL_CPUS',
        // '-co',
        // 'ADD_ALPHA=YES',
        // '-co',
        // `BLOCKSIZE=256`,
        // '-co',
        // 'COMPRESS=webp',
        // '-co',
        // 'NUM_THREADS=ALL_CPUS',
        '-a_nodata',
        '255',
        '-a_srs',
        epsg.toEpsgString(),
        '-a_ullr',
        ...[bounds.x, bounds.bottom, bounds.right, bounds.y],
        input,
        output,
      ].map(String),
      this.logger,
    );
    return output;
  }

  async buildVrt(sourceFiles: string[]): Promise<string> {
    this.logger.info({ path: this.config.tmpFolder }, 'Build Vrt');
    const gdal = Gdal.create();
    if (gdal.mount != null) gdal.mount(this.config.tmpFolder);

    const output = `${this.config.tmpFolder}/terrarium.vrt`;
    await gdal.run('gdalbuildvrt', [output, ...sourceFiles], this.logger);
    return output;
  }

  get tileMatrixFileName(): string {
    const tileMatrix = this.config.tileMatrix;
    // Gdal built in TileMatrixSets
    if (tileMatrix.identifier === GoogleTms.identifier) return 'GoogleMapsCompatible';
    if (tileMatrix.identifier === Nztm2000Tms.identifier) return 'NZTM2000';

    return 'https://raw.githubusercontent.com/linz/NZTM2000TileMatrixSet/master/raw/NZTM2000Quad.json';
  }

  async buildCog(input: string): Promise<string> {
    this.logger.info({ path: this.config.tmpFolder }, 'Build Cog');
    const gdal = Gdal.create();
    if (gdal.mount != null) gdal.mount(this.config.tmpFolder);

    const output = `${this.config.tmpFolder}/terrarium.cog.tiff`;
    await gdal.run(
      'gdal_translate',
      [
        '-of',
        'COG',
        '-co',
        `TILING_SCHEME=${this.tileMatrixFileName}`,
        '-co',
        'NUM_THREADS=ALL_CPUS',
        '-co',
        'BIGTIFF=YES',
        '-co',
        'ADD_ALPHA=YES',
        '-co',
        `BLOCKSIZE=256`,
        '-co',
        'COMPRESS=webp',
        // '-co',
        // 'WEBP_LEVEL=100',
        '-co',
        'QUALITY=90',
        '-co',
        `SPARSE_OK=YES`,
        '-r',
        'bilinear',
        input,
        output,
      ],
      this.logger,
    );
    return output;
  }
}
