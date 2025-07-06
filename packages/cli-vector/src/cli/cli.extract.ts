import { GoogleTms, Nztm2000QuadTms, TileMatrixSets } from '@basemaps/geo';
import { fsa, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, oneOf, option, string } from 'cmd-ts';

import { SchemaLoader } from '../schema-loader/schema.loader.js';
import { VectorCreationOptions, VectorStac } from '../stac.js';
import { StacCatalog, StacCollection, StacLink } from 'stac-ts';

function pathToURLFolder(path: string): URL {
  const url = fsa.toUrl(path);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

export const ExtractArgs = {
  ...logArguments,
  schema: option({
    type: Url,
    long: 'schema',
    defaultValue: () => pathToURLFolder('schema'),
    description:
      'Path of JSON schema file(s) defining the source layer and schemas. Either a directory containing such files, or a path to a single file.',
  }),
  cache: option({
    type: string,
    long: 'cache',
    description: 'Path of cache location, could be local or s3',
  }),
  tileMatrix: option({
    type: oneOf([Nztm2000QuadTms.identifier, GoogleTms.identifier]),
    long: 'tile-matrix',
    description: `Output TileMatrix to use. Either: ${Nztm2000QuadTms.identifier}, or ${GoogleTms.identifier}.`,
    defaultValue: () => GoogleTms.identifier,
    defaultValueIsSerializable: true,
  }),
};

export const ExtractCommand = command({
  name: 'extract',
  version: CliInfo.version,
  description: 'Validation for the Vector ETL to check for updates.',
  args: ExtractArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    const cache = pathToURLFolder(args.cache);
    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);

    // Find all lds layers that need to be process
    logger.info({ schema: args.schema }, 'Extract: Start');
    const schemaLoader = new SchemaLoader(args.schema, tileMatrix, logger, cache);
    const schemas = await schemaLoader.load();
    const smallLayers = [];
    const largeLayers = [];
    const collectionLinks: StacLink[] = [];
    let total = 0;
    const allFiles = [];
    const vectorStac = new VectorStac(logger);
    for (const schema of schemas) {
      for (const layer of schema.layers) {
        if (layer.cache == null) throw new Error(`Fail to prepare cache path for layer ${schema.name}:${layer.id}`);
        allFiles.push({ path: layer.cache.path.href });

        // Skip if the layer is already processed in cache
        if (layer.cache.exists) {
          logger.info({ layer: schema.name, id: layer.id, cache: layer.cache }, 'Extract: Exists');
          continue;
        }

        // Create stac file for the cache mbtiles
        logger.info({ layer: schema.name, id: layer.id }, 'Extract: StacItem');
        const stacItemFile = new URL(layer.cache.path.href.replace(/\.mbtiles$/, '.json'));
        const stacLink = await vectorStac.createStacLink(schema.name, layer);
        const options: VectorCreationOptions = {
          name: schema.name,
          metadata: schema.metadata,
          tileMatrix: tileMatrix.identifier,
          layer,
        };

        // Create the STAC item for the layer
        const stacItem = vectorStac.createStacItem([stacLink], layer.cache.fileName, tileMatrix, options);
        await fsa.write(stacItemFile, JSON.stringify(stacItem, null, 2));

        // Create STAC collection
        const stacCollectionFile = new URL(layer.cache.path.href.replace(layer.cache.fileName, 'collection.json'));
        if (await fsa.exists(stacCollectionFile)) {
          const collection = await fsa.readJson<StacCollection>(stacCollectionFile);
          const itemPath = `./${layer.cache.fileName.replace(/\.mbtiles$/, '.json')}`;
          if (collection.links.find((l) => l.href === itemPath) == null) {
            collection.links.push({ rel: 'item', href: itemPath });
          }
          await fsa.write(stacCollectionFile, JSON.stringify(collection, null, 2));
        } else {
          const title = `Mbtiles cache for ${layer.name}`;
          const collection = vectorStac.createStacCollection(stacItem.bbox!, [], layer.cache.fileName, title);
          await fsa.write(stacCollectionFile, JSON.stringify(collection, null, 2));
        }

        // Prepare Stac collection links for catalog
        collectionLinks.push({
          href: `./${layer.id}/collection.json`,
          title: layer.name,
          type: 'application/json',
          rel: 'child',
        });

        // Prepare task to process
        logger.info({ layer: schema.name, id: layer.id }, 'Extract: ToProcess');

        // Separate large layer as individual task
        if (layer.largeLayer) {
          largeLayers.push({ path: stacItemFile.href });
        } else {
          smallLayers.push({ path: stacItemFile.href });
        }
        total++;
      }
    }

    // Create STAC catalog
    const stacCatalogFile = new URL(`${tileMatrix.projection.code}/catalog.json`, cache);
    if (await fsa.exists(stacCatalogFile)) {
      const catalog = await fsa.readJson<StacCatalog>(stacCatalogFile);
      for (const link of collectionLinks) {
        if (catalog.links.find((l) => l.href === link.href) == null) {
          catalog.links.push(link);
        }
      }
      await fsa.write(stacCatalogFile, JSON.stringify(catalog, null, 2));
    } else {
      const catalog = vectorStac.createStacCatalog();
      catalog.links.push(...collectionLinks);
      await fsa.write(stacCatalogFile, JSON.stringify(catalog, null, 2));
    }

    logger.info({ ToProcess: total }, 'CheckUpdate: Finish');
    await fsa.write(fsa.toUrl('/tmp/extract/allCaches.json'), JSON.stringify(allFiles, null, 2));
    await fsa.write(fsa.toUrl('/tmp/extract/smallLayers.json'), JSON.stringify(smallLayers, null, 2));
    await fsa.write(fsa.toUrl('/tmp/extract/largeLayers.json'), JSON.stringify(largeLayers, null, 2));
    await fsa.write(fsa.toUrl('/tmp/extract/updateRequired'), String(total > 0));
  },
});
