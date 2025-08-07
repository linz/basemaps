import { GoogleTms, Nztm2000QuadTms, StacItem, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogType, stringToUrlFolder, Tiff, urlToString } from '@basemaps/shared';
import { getLogger, logArguments, Url, UrlFolder } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { TiffTagGeo } from '@cogeotiff/core';
import { command, number, oneOf, option, optional, restPositionals } from 'cmd-ts';
import { mkdir, rm } from 'fs/promises';
import { FeatureCollection } from 'geojson';
import { tmpdir } from 'os';
import pLimit from 'p-limit';
import path from 'path';
import { StacCollection } from 'stac-ts';
import { URL } from 'url';

import { gdalBuildChartsCommand } from '../gdal/gdal.command.js';
import { GdalRunner } from '../gdal/gdal.runner.js';
import { bufferCutline, reprojectCutline, wrapCutline } from '../gdal/ogr2ogr.command.js';

/** Limit the creation of COGs to concurrency at the same time */
const Q = pLimit(10);

// ChartCode regex
const chartCodeRegex = /^[A-Z]{2}\d+-\d+$/;

// Prepare a temporary folder to store the gdal processed cutlines and tiffs
const tmpFolder = stringToUrlFolder(path.join(tmpdir(), CliId));

/**
 * Process and standardize charts maps tiffs, and creating STAC collections and items.
 *
 * @param source: Location of the source files
 * @example s3://linz-hydrographic-upload/charts/NChart1200/
 *
 * @param target: Location of the target path
 */
export const ChartsCreationCommand = command({
  name: 'cogify-charts',
  version: CliInfo.version,
  description: 'List input charts map files, cutting off the edges and creating standardized outputs.',
  args: {
    ...logArguments,
    source: option({
      type: optional(UrlFolder),
      long: 'source',
      description: 'Source location of the charts tiffs',
    }),
    target: option({
      type: UrlFolder,
      long: 'target',
      description: 'Target location for the output files',
    }),
    tileMatrix: option({
      type: oneOf([Nztm2000QuadTms.identifier, GoogleTms.identifier]),
      long: 'tile-matrix',
      description: `Output TileMatrix to use. Either: ${Nztm2000QuadTms.identifier}, or ${GoogleTms.identifier}.`,
      defaultValue: () => GoogleTms.identifier,
      defaultValueIsSerializable: true,
    }),
    cutline: option({
      type: UrlFolder,
      long: 'cutline',
      defaultValue: () => new URL('s3://linz-hydrographic-upload/charts/RNCPANEL/'),
      description: 'Location of the cutlines to cut tiffs, save the shp files for the cutlines.',
    }),
    bufferPixels: option({
      type: number,
      long: 'buffer-pixels',
      defaultValue: () => 10,
      description: 'Number of pixels to buffer the cutlines.',
    }),
    paths: restPositionals({
      type: Url,
      description: 'Source paths for the charts tiffs',
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args, 'cli-raster');
    logger.info('Charts:Start');
    const files = args.source ? await fsa.toArray(fsa.list(args.source)) : args.paths;

    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);

    // Process and standardize charts maps tiffs
    await mkdir(tmpFolder, { recursive: true });
    const outputs = new Set<string>();
    const toProcess = files.map((file) =>
      Q(async () => {
        if (!file.href.endsWith('.tif')) return;

        const filename = file.pathname.split('/').pop();
        if (filename == null) {
          logger.warn({ file }, 'Filename not found in URL');
          return;
        }
        const chartCode = filename?.split('.')[0];
        if (chartCode == null || !chartCodeRegex.test(chartCode)) {
          logger.warn({ file }, 'Chart code not found or invalid');
          return;
        }

        // Download the source tiff file and cutline files
        const sourceTiff = await downloadCharts(file, filename, logger);
        const cutline = await downloadCutlines(new URL(args.cutline.href), chartCode, logger);

        logger.info({ file: file.href, tileMatrix: tileMatrix.identifier, chartCode }, 'Charts:Processing');
        const tiff = await new Tiff(fsa.source(sourceTiff)).init();

        // Prepare buffered cutline
        const bufferedCutline = await prepareCutline(
          cutline,
          chartCode,
          tileMatrix,
          tiff.images[0].resolution[0],
          args.bufferPixels,
          logger,
        );

        // Create a STAC files for the chart map
        const { item, collection } = await createStacFiles(
          chartCode,
          tileMatrix,
          tiff,
          cutline,
          bufferedCutline,
          logger,
        );

        // Create Cog for the chart map
        logger.info({ file: file.href, chartCode, tileMatrix: tileMatrix.identifier }, 'Charts:GdalBuildCharts');
        const cogFile = new URL(`${chartCode}-${tileMatrix.identifier}.tif`, tmpFolder);
        await new GdalRunner(gdalBuildChartsCommand(cogFile, sourceTiff, bufferedCutline, tileMatrix)).run(logger);

        // write the cog file to the target path
        const targetPath = new URL(`${tileMatrix.projection.code}/${chartCode}/`, args.target);
        logger.info({ file: file.href, target: targetPath.href }, 'Charts:Uploading');
        if (targetPath.protocol === 'file:') await mkdir(targetPath, { recursive: true });
        const targetTiff = new URL(`${filename}`, targetPath);
        await fsa.write(targetTiff, fsa.readStream(cogFile));

        // Write the item and collection to the target path
        const targetItem = new URL(`${chartCode}.json`, targetPath);
        await fsa.write(targetItem, JSON.stringify(item, null, 2));
        const targetCollection = new URL('collection.json', targetPath);
        await fsa.write(targetCollection, JSON.stringify(collection, null, 2));

        // Add the target files to the outputs
        outputs.add(urlToString(targetPath));
      }),
    );

    await Promise.all(toProcess);
    await fsa.write(fsa.toUrl('/tmp/extract/output.json'), JSON.stringify(Array.from(outputs), null, 2));
    logger.info({ outputCount: outputs.size, target: args.target.href }, 'Charts:Done');
    await rm(tmpFolder, { recursive: true, force: true });
  },
});

// Download Charts Tiff files into local folder for dgal to process
async function downloadCharts(file: URL, filename: string, logger: LogType): Promise<URL> {
  logger.info({ file: file.href, filename }, 'Charts:DownloadTiff');
  if ((await fsa.head(file)) == null) throw new Error(`File does not exist: ${file.href}`);
  const sourceTiff = new URL(filename, tmpFolder);
  await fsa.write(sourceTiff, fsa.readStream(file));
  return sourceTiff;
}

// Download Charts Cutlines into local folder for gdal to process
async function downloadCutlines(cutline: URL, chartCode: string, logger: LogType): Promise<URL> {
  logger.info({ cutline: cutline.href, chartCode }, 'Charts:DownloadCutline');
  const formats = ['shp', 'shx', 'dbf', 'prj'];
  for (const format of formats) {
    const cutlineFile = new URL(`${chartCode}.${format}`, tmpFolder);
    const cutlineUrl = new URL(`${cutline.href}${chartCode}.${format}`);
    if ((await fsa.head(cutlineUrl)) == null) {
      logger.warn({ cutline: cutlineUrl.href }, 'Charts:Cutline does not exist');
      continue;
    }
    await fsa.write(cutlineFile, fsa.readStream(cutlineUrl));
  }
  return new URL(`${chartCode}.shp`, tmpFolder);
}

/**
 * Prepare the cutline for charts mapsheets by wrapping, reprojecting, and buffering it to remove edge artifacts.
 */
async function prepareCutline(
  cutline: URL,
  chartCode: string,
  tileMatrix: TileMatrixSet,
  gsd: number,
  bufferPixels: number,
  logger: LogType,
): Promise<URL> {
  // Wrap the cutline to multipolygon if it crosses the Prime Meridian
  logger.info({ cutline: cutline.href, chartCode }, 'Charts:WrapCutline');
  const wrappedCutline = new URL(`${chartCode}-wrapped.shp`, tmpFolder);
  await new GdalRunner(wrapCutline(wrappedCutline, cutline)).run(logger);

  // Reproject the cutline to the target tile matrix
  logger.info({ cutline: cutline.href, chartCode, tileMatrix: tileMatrix.identifier }, 'Charts:ReprojectCutline');
  const reprojectedCutline = new URL(`${chartCode}-${tileMatrix.identifier}.shp`, tmpFolder);
  await new GdalRunner(reprojectCutline(reprojectedCutline, wrappedCutline, tileMatrix)).run(logger);

  // Buffer the cutline
  logger.info({ cutline: cutline.href, chartCode, gsd, bufferPixels }, 'Charts:BufferCutline');
  const bufferedCutline = new URL(`${chartCode}-buffered.geojson`, tmpFolder);
  await new GdalRunner(
    bufferCutline(bufferedCutline, reprojectedCutline, `${chartCode}-${tileMatrix.identifier}`, gsd, bufferPixels),
  ).run(logger);

  return bufferedCutline;
}

async function createStacFiles(
  chartCode: string,
  tileMatrix: TileMatrixSet,
  tiff: Tiff,
  sourceCutline: URL,
  bufferedCutline: URL,
  logger: LogType,
): Promise<{ item: StacItem; collection: StacCollection }> {
  const image = tiff.images[0];
  // Create stac item
  logger.info({ chartCode }, 'Charts:CreateStacItem');
  const geojson = await fsa.readJson<FeatureCollection>(bufferedCutline);
  const item: StacItem = {
    id: `${CliId}/${chartCode}`,
    type: 'Feature',
    collection: CliId,
    stac_version: '1.0.0-beta.2',
    stac_extensions: [],
    geometry: geojson.features[0].geometry,
    bbox: image.bbox,
    links: [
      { href: `./${chartCode}.json`, rel: 'self' },
      { href: './collection.json', rel: 'collection' },
      { href: './collection.json', rel: 'parent' },
      {
        href: urlToString(tiff.source.url),
        rel: 'linz_basemaps:source',
        type: 'image/tiff; application=geotiff;',
        'linz_basemaps:source_height': image.size.height,
        'linz_basemaps:source_width': image.size.width,
        'linz_basemaps:source_gsd': image.resolution[0],
      },
      {
        href: urlToString(sourceCutline),
        rel: 'linz_basemaps:cutline',
      },
    ],
    properties: {
      datetime: CliDate,
      'proj:epsg': tileMatrix.projection.code,
      'linz_basemaps:options': {
        tileMatrix: tileMatrix.identifier,
        sourceEpsg: image.epsg ?? image.valueGeo(TiffTagGeo.GeodeticCRSGeoKey),
      },
      'linz_basemaps:generated': {
        package: CliInfo.package,
        hash: CliInfo.hash,
        version: CliInfo.version,
        datetime: CliDate,
      },
    },
    assets: {},
  };

  // Create stac collection
  logger.info({ chartCode }, 'Charts:CreateStacCollection');
  const collection: StacCollection = {
    id: CliId,
    type: 'Collection',
    stac_version: '1.0.0',
    stac_extensions: [],
    license: 'CC-BY-4.0',
    title: `New Zealand Charts Mapsheets - ${chartCode}`,
    description: `New Zealand Charts Mapsheets - ${chartCode} - ${tileMatrix.identifier}`,
    extent: {
      spatial: { bbox: [item.bbox] },

      temporal: { interval: [[CliDate, null]] },
    },
    links: [
      { rel: 'self', href: './collection.json', type: 'application/json' },
      {
        href: `./${item.id}.json`,
        rel: 'item',
        type: 'application/json',
      },
    ],
  };
  return { item, collection };
}
