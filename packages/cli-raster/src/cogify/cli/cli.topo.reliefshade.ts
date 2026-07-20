import { fsa, LogType, Tiff, urlToString } from '@basemaps/shared';
import { getLogger, logArguments, UrlFolder } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, option, optional, string } from 'cmd-ts';
import { gdalBuildTopoReliefShadeCommands } from '../gdal/gdal.command.js';
import { GdalRunner } from '../gdal/gdal.runner.js';
import { basename } from 'path/win32';
import { mkdir } from 'fs/promises';
import { SpatialExtents, StacCollection, StacItem } from 'stac-ts';
import { Bounds } from '@basemaps/geo';
import pLimit from 'p-limit';

/**
 * Parses a source path directory topographic maps tiffs and writes out a directory structure
 * of StacItem and StacCollection files to the target path.
 *
 * @param source: Location of the source files
 * @example s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/
 *
 * @param target: Location of the target path
 */
export const TopoReliefShadeCreationCommand = command({
  name: 'cogify-topo-reliefshade',
  version: CliInfo.version,
  description: 'List input topographic relief shade files, standarised the files and create Stacs.',
  args: {
    ...logArguments,
    title: option({
      type: optional(string),
      long: 'title',
      description: 'Imported imagery title. By default, the title is derived from the map series name',
    }),
    target: option({
      type: UrlFolder,
      long: 'target',
      description: 'Target location for the output files',
    }),
    tempLocation: option({
      type: UrlFolder,
      long: 'temp-location',
      description: 'Temporary location for intermediate files',
    }),
    source: option({
      type: UrlFolder,
      long: 'source',
      description: 'Location of the source files',
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args, 'cli-raster');
    const Q = pLimit(10);
    // const startTime = performance.now();
    logger.info('TopoCogify:Start');
    await mkdir(args.target, { recursive: true });
    await mkdir(args.tempLocation, { recursive: true });
    await mkdir(new URL('./source', args.tempLocation), { recursive: true });
    await mkdir(new URL('./target', args.tempLocation), { recursive: true });

    const items: StacItem[] = [];
    const processed: URL[] = [];
    const tasks: Array<Promise<void>> = [];
    for await (const source of fsa.list(args.source)) {
      if (source.href.endsWith('.tif') || source.href.endsWith('.tiff')) {
        tasks.push(
          Q(async () => {
            logger.info({ source: source.href }, 'ProcessReliefShade:Start');
            // Download tiff and tfw to temp location for processing
            const downloadTiff = new URL(`./source/${basename(source.pathname)}`, args.tempLocation);
            await fsa.write(downloadTiff, fsa.readStream(source));

            // Prepare the bounds from the TFW file
            const tfw = await loadTfw(source, logger);
            const x1 = tfw.origin.x;
            const y1 = tfw.origin.y;
            const bounds = new Bounds(x1, y1, tfw.scale.x * 2400, tfw.scale.y * 3600);
            const target = new URL(`./target/${basename(source.href)}`, args.tempLocation);
            const command = gdalBuildTopoReliefShadeCommands(downloadTiff, target, bounds);
            await new GdalRunner(command).run(logger);
            processed.push(target);

            logger.info({ source: source.href, target: target.href }, 'ProcessReliefShade:End');

            const filename = source.pathname.split('/').pop();
            if (filename == null) {
              logger.warn({ source }, 'Filename not found in URL');
              return;
            }
            const id = filename?.split('.')[0];
            const item = await createStacItem(id, target, bounds, logger);
            items.push(item);
            const tiff = await new Tiff(fsa.source(target)).init();
            const image = tiff.images[0];

            logger.info({ source: source.href, resolution: image.resolution }, 'ReliefShadeResolution');
          }),
        );
      }
    }
    await Promise.all(tasks);

    logger.info({ items: items.length }, 'WriteTargets:Start');
    const collection = CreateStacCollection(items, logger);
    await Promise.all([
      processed.map((c) => fsa.write(new URL(`./${basename(c.pathname)}`, args.target), fsa.readStream(c))),
      items.map((item) =>
        fsa.write(new URL(`./${item.id}.json`, args.target), JSON.stringify(item, null, 2)),
      ),
      fsa.write(new URL('./collection.json', args.target), JSON.stringify(collection, null, 2)),
    ]);
    logger.info({ items: items.length }, 'WriteTargets:End');
  },
});

export type TfwParseResult = {
  scale: { x: number; y: number };
  origin: { x: number; y: number };
};

/**
 * Attempt to load a tiff world file and return parsed values
 *
 *
 * @param imageLoc Location of TIFF file
 * @returns
 */
export async function loadTfw(imageLoc: URL, logger: LogType): Promise<TfwParseResult> {
  const baseLocation = replaceUrlPathPattern(imageLoc, new RegExp('\\.tiff?$', 'i'));

  const tfwVariants = ['.tfw', '.TFW', '.Tfw']; // add more if needed
  let tfwData;
  for (const tfwExtension of tfwVariants) {
    const candidateTfwLocation = fsa.toUrl(baseLocation.href + tfwExtension);
    try {
      tfwData = await fsa.read(candidateTfwLocation);
      logger.info({ tfwUrl: candidateTfwLocation.href }, 'TFWFound');
      break;
    } catch (err) { }
  }

  if (!tfwData) {
    throw new Error(`Unable to find TFW file for image: ${imageLoc.href} with base location: ${baseLocation.href} and extensions: ${tfwVariants.join(', ')}`);
  }
  return parseTfw(String(tfwData));
}

/**
 * Attempt to parse a tiff world file
 *
 *
 * @param data Raw TFW file
 * @returns
 */
export function parseTfw(data: string): TfwParseResult {
  const parts = data.split('\n');
  if (parts.length < 6) throw new Error('TFW: Not enough points');
  const scaleX = Number(parts[0]);
  const scaleY = Number(parts[3]);
  if (Number.isNaN(scaleX) || Number.isNaN(scaleY)) throw new Error('TFW: Invalid scales: ' + data);

  const rotationX = Number(parts[1]);
  const rotationY = Number(parts[2]);
  if (rotationX !== 0 || rotationY !== 0) throw new Error('TFW: Rotation must be zero');

  const originX = Number(parts[4]);
  const originY = Number(parts[5]);
  if (Number.isNaN(originX) || Number.isNaN(originY)) throw new Error('TFW: Invalid origins: ' + data);
  return { scale: { x: scaleX, y: scaleY }, origin: { x: originX - scaleX / 2, y: originY - scaleY / 2 } };
}

/**
 * Replace a pattern in a URL, typically used to remove `.tiff` or `.tif` extensions.
 *
 * @param location (URL) to modify
 * @param pattern to replace
 * @param replaceValue to replace the pattern with, defaults to an empty string
 *
 * @returns modified location as a new URL object
 */
export function replaceUrlPathPattern(location: URL, pattern: RegExp, replaceValue: string = ''): URL {
  const modifiedLocation = new URL(location);
  modifiedLocation.pathname = modifiedLocation.pathname.replace(pattern, replaceValue);
  return modifiedLocation;
}

async function createStacItem(
  id: string,
  source: URL,
  bounds: Bounds,
  logger: LogType,
): Promise<StacItem> {
  // Create stac item
  logger.info({ id }, 'Charts:CreateStacItem');
  const item: StacItem = {
    id,
    type: 'Feature',
    collection: CliId,
    stac_version: '1.0.0',
    stac_extensions: [],
    geometry: { type: 'Polygon', coordinates: bounds.toPolygon() },
    bbox: bounds.toBbox(),
    links: [
      { href: `./${id}.json`, rel: 'self' },
      { href: './collection.json', rel: 'collection' },
      { href: './collection.json', rel: 'parent' },
      {
        href: urlToString(source),
        rel: 'source',
        type: 'image/tiff; application=geotiff;',
      },
    ],
    properties: {
      datetime: CliDate,
      'proj:epsg': 2193,
    },
    assets: {
      'data': {
        href: `./${id}.tiff`,
        type: 'image/tiff; application=geotiff;',
      },
    }
  }

  return item;
}

function CreateStacCollection(items: StacItem[], logger: LogType): StacCollection {
  // Create stac collection
  logger.info({ CliId, items: items.length }, 'Charts:CreateStacCollection');
  const collection: StacCollection = {
    id: CliId,
    type: 'Collection',
    stac_version: '1.0.0',
    stac_extensions: [],
    license: 'CC-BY-4.0',
    title: `New Zealand Topo50 Reliefshade`,
    description: `New Zealand Topo50 Reliefshade derived from LINZ's Topo50 mapsheets.`,
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
    collection.extent.spatial.bbox.push(item.bbox!);
  }

  return collection;
}