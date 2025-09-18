import { Bounds, EpsgCode, GoogleTms, StacItem } from '@basemaps/geo';
import { fsa, LogType, stringToUrlFolder, Tiff, urlToString } from '@basemaps/shared';
import { getLogger, logArguments, Url, UrlFolder } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { command, number, option, optional, restPositionals } from 'cmd-ts';
import { mkdir, rm } from 'fs/promises';
import { FeatureCollection } from 'geojson';
import { tmpdir } from 'os';
import pLimit from 'p-limit';
import path from 'path';
import { SpatialExtents, StacCollection } from 'stac-ts';
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

// Imagery metadata interface to store the source, gsd, epsg, and bbox
interface ImageryMetadata {
  source: URL;
  gsd: number;
  epsg: EpsgCode;
  size: {
    width: number;
    height: number;
  };
}

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
    cutline: option({
      type: UrlFolder,
      long: 'cutline',
      defaultValue: () => new URL('s3://linz-hydrographic-upload/charts/RNCPANEL/'),
      description: 'Location of the cutlines to cut tiffs, save the shp files for the cutlines.',
    }),
    backup: option({
      type: UrlFolder,
      long: 'backup',
      defaultValue: () => new URL('s3://linz-hydrographic-upload/charts/CChart/'),
      description: 'Location of the backup tiff files for get all the imagery metadata.',
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

        logger.info({ file: file.href, chartCode }, 'Charts:Processing');
        const tiff = await new Tiff(fsa.source(file)).init();
        const backUpUrl = new URL(filename, args.backup);
        const metadata = await fetchMetadata(tiff, backUpUrl, logger);

        // Prepare buffered cutline
        const bufferedCutline = await prepareCutline(cutline, chartCode, metadata.gsd, args.bufferPixels, logger);

        // Create cog for each polygon from the cutline to seperate the cogs that crossing antimeridian
        const targetPath = new URL(`${GoogleTms.projection.code}/${CliId}/${chartCode}/`, args.target);
        if (targetPath.protocol === 'file:') await mkdir(targetPath, { recursive: true });

        // Create COGs
        await createCogs(sourceTiff, cutline, chartCode, bufferedCutline, metadata, targetPath, logger);

        // Add the target files to the outputs
        outputs.add(urlToString(targetPath));
        await tiff.source.close?.();
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
 * Only cut the charts in Web Mercator projection to provide better outputs
 */
async function prepareCutline(
  cutline: URL,
  chartCode: string,
  gsd: number,
  bufferPixels: number,
  logger: LogType,
): Promise<URL> {
  // Wrap the cutline to multipolygon if it crosses the Prime Meridian
  logger.info({ cutline: cutline.href, chartCode }, 'Charts:WrapCutline');
  const wrappedCutline = new URL(`${chartCode}-wrapped.shp`, tmpFolder);
  await new GdalRunner(wrapCutline(wrappedCutline, cutline)).run(logger);

  // Reproject the cutline to the target tile matrix
  logger.info({ cutline: cutline.href, chartCode, tileMatrix: GoogleTms.identifier }, 'Charts:ReprojectCutline');
  const reprojectedCutline = new URL(`${chartCode}-${GoogleTms.identifier}.shp`, tmpFolder);
  await new GdalRunner(reprojectCutline(reprojectedCutline, wrappedCutline, GoogleTms)).run(logger);

  // Buffer the cutline
  logger.info({ cutline: cutline.href, chartCode, gsd, bufferPixels }, 'Charts:BufferCutline');
  const bufferedCutline = new URL(`${chartCode}-buffered.geojson`, tmpFolder);
  await new GdalRunner(
    bufferCutline(bufferedCutline, reprojectedCutline, `${chartCode}-${GoogleTms.identifier}`, gsd, bufferPixels),
  ).run(logger);

  return bufferedCutline;
}

/**
 * Fetch the Ground Sample Distance (GSD) and Bounding Box (BBOX) from the TIFF file.
 * Some of charts mapsheets do not have the GSD in the original TIFF metadata.(NChart1200 folder)
 * But the GSD is always the same for the same chart code tiff files from other folders (CChart).
 * If the GSD is not found, it attempts to fetch it from a backup location.
 */
async function fetchMetadata(tiff: Tiff, backUpUrl: URL, logger: LogType): Promise<ImageryMetadata> {
  logger.info({ file: tiff.source.url }, 'Charts:FetchImageryMetadata');

  const source = tiff.source.url;
  const size = tiff.images[0].size;
  const epsg = tiff.images[0].epsg ?? tiff.images[0].valueGeo(TiffTagGeo.GeodeticCRSGeoKey) ?? EpsgCode.Wgs84;

  try {
    const gsd = tiff.images[0].resolution[0];
    return { source, gsd, epsg, size };
  } catch (error) {
    logger.warn({ file: tiff.source.url }, 'Tag not found try to fetch from back up folder');
    const exist = await fsa.head(backUpUrl);
    if (!exist) throw new Error(`No back up file to extract metadata: ${backUpUrl.href}`);
    const backUpTiff = await new Tiff(fsa.source(backUpUrl)).init();
    const backUpTag = await backUpTiff.images[0].fetch(TiffTag.ModelPixelScale);
    if (backUpTag == null) throw new Error(`ModelPixelScale tag not found in ${backUpUrl.href}`);
    await backUpTiff.source.close?.();
    return {
      source: tiff.source.url,
      gsd: backUpTag[0],
      epsg,
      size: tiff.images[0].size,
    };
  }
}

export function geojsonToBbox(geojson: FeatureCollection): GeoJSON.BBox {
  let union: Bounds | null = null;
  for (const feature of geojson.features) {
    let bounds;
    if (feature.geometry.type === 'Polygon') {
      bounds = Bounds.fromMultiPolygon([feature.geometry.coordinates]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      bounds = Bounds.fromMultiPolygon(feature.geometry.coordinates);
    } else {
      throw new Error('GeoJSON must contain Polygon or MultiPolygon geometries');
    }
    if (union == null) {
      union = bounds;
    } else {
      union = union.union(bounds);
    }
  }
  if (union == null) throw new Error('No union found in GeoJSON features');
  return union.toBbox();
}

async function createStacItem(
  chartCode: string,
  metadata: ImageryMetadata,
  sourceCutline: URL,
  cutline: URL,
  logger: LogType,
): Promise<StacItem> {
  // Create stac item
  const geojson = await fsa.readJson<FeatureCollection>(cutline);
  logger.info({ chartCode }, 'Charts:CreateStacItem');
  const item: StacItem = {
    id: `${CliId}/${chartCode}`,
    type: 'Feature',
    collection: CliId,
    stac_version: '1.0.0-beta.2',
    stac_extensions: [],
    geometry: geojson.features[0].geometry,
    bbox: geojsonToBbox(geojson),
    links: [
      { href: `./${chartCode}.json`, rel: 'self' },
      { href: './collection.json', rel: 'collection' },
      { href: './collection.json', rel: 'parent' },
      {
        href: urlToString(metadata.source),
        rel: 'linz_basemaps:source',
        type: 'image/tiff; application=geotiff;',
        'linz_basemaps:source_height': metadata.size.height,
        'linz_basemaps:source_width': metadata.size.width,
      },
      {
        href: urlToString(sourceCutline),
        rel: 'linz_basemaps:cutline',
      },
    ],
    properties: {
      datetime: CliDate,
      'proj:epsg': GoogleTms.projection.code,
      'linz_basemaps:options': {
        tileMatrix: GoogleTms.identifier,
        sourceEpsg: metadata.epsg,
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

  return item;
}

function CreateStacCollection(chartCode: string, items: StacItem[], logger: LogType): StacCollection {
  // Create stac collection
  logger.info({ chartCode }, 'Charts:CreateStacCollection');
  const collection: StacCollection = {
    id: CliId,
    type: 'Collection',
    stac_version: '1.0.0',
    stac_extensions: [],
    license: 'CC-BY-4.0',
    title: `New Zealand Charts Mapsheets - ${chartCode}`,
    description: `New Zealand Charts Mapsheets - ${chartCode} - ${GoogleTms.identifier}`,
    extent: {
      spatial: { bbox: items.map((i) => i.bbox as number[]) as SpatialExtents },
      temporal: { interval: [[CliDate, null]] },
    },
    links: [
      { rel: 'self', href: './collection.json', type: 'application/json' },
      ...items.map((item) => ({
        href: `./${item.id}.json`,
        rel: 'item',
        type: 'application/json',
      })),
    ],
  };

  for (const item of items) {
    collection.extent.spatial.bbox.push(item.bbox);
  }
  return collection;
}

// Split the cutline into single polygon features and create cog for each polygon
async function createCogs(
  sourceTiff: URL,
  sourceCutline: URL,
  chartCode: string,
  bufferedCutline: URL,
  metadata: ImageryMetadata,
  targetPath: URL,
  logger: LogType,
): Promise<void> {
  const geojson = await fsa.readJson<FeatureCollection>(bufferedCutline);
  let index = 0;
  const items: StacItem[] = [];
  for (const feature of geojson.features) {
    if (feature.geometry.type === 'Polygon') {
      const sliptedCutline = {
        type: 'FeatureCollection',
        crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::3857' } },
        features: [feature],
      };
      const cutlineFile = new URL(`cutline-${index}.geojson`, tmpFolder);
      await fsa.write(cutlineFile, JSON.stringify(sliptedCutline));
      // Create Stac item for each cog
      const item = await createStacItem(`${chartCode}-${index}`, metadata, sourceCutline, cutlineFile, logger);
      await fsa.write(new URL(`${chartCode}-${index}.json`, targetPath), JSON.stringify(item, null, 2));
      items.push(item);
      // Create Cog for the chart map
      const cog = new URL(`${chartCode}-${index}.tif`, tmpFolder);
      await new GdalRunner(gdalBuildChartsCommand(cog, sourceTiff, cutlineFile, GoogleTms)).run(logger);
      await fsa.write(new URL(`${chartCode}-${index}.tif`, targetPath), fsa.readStream(cog));
      index++;
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const coords of feature.geometry.coordinates) {
        const splitCutline = {
          type: 'FeatureCollection',
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::3857' } },
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: coords },
            },
          ],
        };
        const cutlineFile = new URL(`cutline-${index}.geojson`, tmpFolder);
        await fsa.write(cutlineFile, JSON.stringify(sliptedCutline));
        // Create Stac item for each cog
        const item = await createStacItem(`${chartCode}-${index}`, metadata, sourceCutline, cutlineFile, logger);
        await fsa.write(new URL(`${chartCode}-${index}.json`, targetPath), JSON.stringify(item, null, 2));
        items.push(item);
        // Create Cog for the chart map
        const cog = new URL(`${chartCode}-${index}.tif`, tmpFolder);
        await new GdalRunner(gdalBuildChartsCommand(cog, sourceTiff, cutlineFile, GoogleTms)).run(logger);
        await fsa.write(new URL(`${chartCode}-${index}.tif`, targetPath), fsa.readStream(cog));
        index++;
      }
    } else {
      throw new Error('GeoJSON must contain Polygon or MultiPolygon geometries');
    }
  }
  // Create Stac collection
  const collection = CreateStacCollection(chartCode, items, logger);
  await fsa.write(new URL('collection.json', targetPath), JSON.stringify(collection, null, 2));
}
