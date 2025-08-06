import { GoogleTms, Nztm2000QuadTms, StacItem, TileMatrixSets } from '@basemaps/geo';
import { fsa, stringToUrlFolder, Tiff, urlToString } from '@basemaps/shared';
import { getLogger, logArguments, Url, UrlFolder } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { TiffTagGeo } from '@cogeotiff/core';
import { command, oneOf, option, optional, restPositionals } from 'cmd-ts';
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

    const tmpFolder = stringToUrlFolder(path.join(tmpdir(), CliId));
    await mkdir(tmpFolder, { recursive: true });

    // Process and standardize charts maps tiffs
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

        logger.info({ file: file.href, chartCode }, 'Charts:Download');
        if ((await fsa.head(file)) == null) {
          logger.warn({ file: file.href }, 'File does not exist');
          return;
        }
        const sourceTiff = new URL(`${filename}`, tmpFolder);
        await fsa.write(sourceTiff, fsa.readStream(file));
        const cutline = new URL(`${args.cutline.href}${chartCode}.shp`);
        const cutlineFile = new URL(`${chartCode}.shp`, tmpFolder);
        if ((await fsa.head(cutline)) == null) {
          logger.warn({ cutline: cutline.href }, 'Cutline does not exist');
          return;
        }
        await fsa.write(cutlineFile, fsa.readStream(cutline));
        await fsa.write(
          new URL(`${chartCode}.shx`, tmpFolder),
          fsa.readStream(new URL(`${args.cutline.href}${chartCode}.shx`)),
        );
        await fsa.write(
          new URL(`${chartCode}.dbf`, tmpFolder),
          fsa.readStream(new URL(`${args.cutline.href}${chartCode}.dbf`)),
        );
        await fsa.write(
          new URL(`${chartCode}.prj`, tmpFolder),
          fsa.readStream(new URL(`${args.cutline.href}${chartCode}.prj`)),
        );

        logger.info({ file: file.href, tileMatrix: tileMatrix.identifier, chartCode }, 'Charts:Processing');

        const tiff = await new Tiff(fsa.source(sourceTiff)).init();
        const image = tiff.images[0];
        const outputPath = `${tileMatrix.projection.code}/${chartCode}/${CliId}/`;
        const targetPath = new URL(outputPath, tmpFolder);
        await mkdir(targetPath, { recursive: true });

        // Wrap the cutline to multipolygon if it crosses the Prime Meridian

        logger.info({ cutline: cutline.href, chartCode }, 'Charts:WrapCutline');
        const wrappedCutline = new URL(`${chartCode}-wrapped.shp`, tmpFolder);
        await new GdalRunner(wrapCutline(wrappedCutline, cutlineFile)).run(logger);

        // Reproject the cutline to the target tile matrix
        logger.info({ cutline: cutline.href, chartCode, tileMatrix: tileMatrix.identifier }, 'Charts:ReprojectCutline');
        const reprojectedCutline = new URL(`${chartCode}-${tileMatrix.identifier}.shp`, tmpFolder);
        await new GdalRunner(reprojectCutline(reprojectedCutline, wrappedCutline, tileMatrix)).run(logger);

        // Buffer the cutline
        const gsd = image.resolution[0];
        logger.info({ cutline: cutline.href, chartCode, gsd }, 'Charts:BufferCutline');
        const bufferedCutline = new URL(`${chartCode}-buffered.geojson`, tmpFolder);
        await new GdalRunner(
          bufferCutline(bufferedCutline, reprojectedCutline, `${chartCode}-${tileMatrix.identifier}`, gsd),
        ).run(logger);

        // Create stac item
        const itemPath = new URL(`${outputPath}${chartCode}.json`, args.target);
        logger.info({ item: itemPath.href, chartCode }, 'Charts:CreateStacItem');
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
              href: urlToString(cutline),
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
        await fsa.write(itemPath, JSON.stringify(item, null, 2));

        // Create stac collection
        const collectionUrl = new URL(`${outputPath}collection.json`, args.target);
        logger.info({ collection: collectionUrl.href, chartCode }, 'Charts:CreateStacCollection');
        const exists = await fsa.head(collectionUrl);
        if (exists == null) {
          const collection = {
            id: CliId,
            type: 'Collection',
            stac_version: '1.0.0',
            stac_extensions: [],
            license: 'CC-BY-4.0',
            title: `New Zealand Charts Mapsheets - ${tileMatrix.projection.code}`,
            description: `New Zealand Charts Mapsheets - ${tileMatrix.projection.code} - ${tileMatrix.identifier}`,
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
          await fsa.write(collectionUrl, JSON.stringify(collection, null, 2));
        } else {
          const collection = await fsa.readJson<StacCollection>(collectionUrl);
          // Merge with existing collection
          collection.links.push({
            href: `./${item.id}.json`,
            rel: 'item',
            type: 'application/json',
          });
          await fsa.write(collectionUrl, JSON.stringify(collection, null, 2));
        }

        // Reproject the chart map to target tile matrix with cutline
        logger.info({ file: file.href, chartCode, tileMatrix: tileMatrix.identifier }, 'Charts:GdalBuildCharts');
        const target = new URL(filename, targetPath);
        await new GdalRunner(gdalBuildChartsCommand(target, sourceTiff, bufferedCutline, tileMatrix)).run(logger);

        // write the outputs to target
        const targetTiff = new URL(`${outputPath}${filename}`, args.target);
        await fsa.write(targetTiff, fsa.readStream(target));
        outputs.add(urlToString(new URL(`${outputPath}`, args.target)));
      }),
    );

    await Promise.all(toProcess);
    await fsa.write(fsa.toUrl('/tmp/extract/output.json'), JSON.stringify(Array.from(outputs), null, 2));
    logger.info({ outputCount: outputs.size, target: args.target.href }, 'Charts:Done');
    await rm(tmpFolder, { recursive: true, force: true });
  },
});
