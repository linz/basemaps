import { BoundingBox, Bounds, Epsg, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { StacCatalog, StacCollection, StacItem, StacLink, StacProvider } from 'stac-ts';

import { LDS_CACHE_BUCKET } from './extract.js';
import { zLayer, zTypeLayer } from './schema-loader/parser.js';
import { Layer, SchemaMetadata } from './schema-loader/schema.js';

export interface VectorCreationOptions {
  /** Schema name for the layer*/
  name: string;
  /**Schema metadata for creation vector tiles  */
  metadata: SchemaMetadata;
  /** Tile matrix to create the tiles against */
  tileMatrix: string;
  /** Individual layer options  */
  layer: Layer;
}

export interface GeneratedProperties {
  /** Package name that generated the file */
  package: string;

  /** Version number that generated the file */
  version: string;

  /** Git commit hash that the file was generated with */
  hash: string;

  /** ISO date of the time this file was generated */
  datetime: string;
}

export type VectorStacItem = StacItem & {
  properties: {
    'linz_basemaps:generated': GeneratedProperties;
    'linz_basemaps:options': VectorCreationOptions;
  };
};

const providers: StacProvider[] = [
  { name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor', 'host'] },
];

export class VectorStac {
  logger: LogType;

  /** List of bounding boxes for the layer, to union as collection bbox */
  bboxArr: BoundingBox[] = [];

  constructor(logger: LogType) {
    this.logger = logger;
  }

  async createStacLink(targetLayer: string, layer: Layer): Promise<StacLink> {
    if (layer.source.startsWith(LDS_CACHE_BUCKET)) {
      // Create stac link for lds layer
      this.logger.info({ layer: layer.id }, 'VectorStac: CreateLdsStacLink');
      const collectionPath = new URL('collection.json', layer.source);
      const sourceCollection = await fsa.readJson<StacCollection>(collectionPath);
      const spatialExtents = sourceCollection.extent.spatial.bbox;
      this.bboxArr.push(...spatialExtents.map((b) => Bounds.fromBbox(b)));
      const stacLink: StacLink = {
        rel: 'lds:layer',
        'lds:id': layer.id,
        'lds:name': layer.name,
        'lds:title': sourceCollection.title,
        'lds:version': layer.version,
        'basemaps:layers': targetLayer,
        href: `https://data.linz.govt.nz/services/api/v1/layers/${layer.id}/versions/${layer.version}/`,
      };
      if (layer.metrics != null) {
        stacLink['lds:feature_count'] = layer.metrics.input;
      }
      return stacLink;
    } else {
      this.logger.info({ layer: layer.id }, 'VectorStac: CreateExternalStacLink');
      // Create stac link for external layer
      const stacLink: StacLink = {
        rel: 'layer',
        id: layer.id,
        name: layer.name,
        'basemaps:layers': targetLayer,
        href: `https://data.linz.govt.nz/services/api/v1/layers/${layer.id}/versions/${layer.version}/`,
      };
      return stacLink;
    }
  }

  createStacItem(
    layers: StacLink[],
    filename: string,
    tileMatrix: TileMatrixSet,
    options: VectorCreationOptions,
  ): VectorStacItem {
    this.logger.info({ filename }, 'VectorStac: CreateStacItem');
    const item: VectorStacItem = {
      id: `${CliId}/${filename}`,
      type: 'Feature',
      collection: CliId,
      stac_version: '1.0.0',
      stac_extensions: [],
      geometry: null,
      bbox: [-180, -90, 180, 90],
      links: [
        { href: `./${filename}.json`, rel: 'self' },
        { href: './collection.json', rel: 'collection' },
        { href: './collection.json', rel: 'parent' },
        ...layers,
      ],
      properties: {
        'proj:epsg': tileMatrix.projection.code,
        'linz_basemaps:options': options,
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

  createStacCollection(bbBox: number[], layers: StacLink[], filename: string, title: string): StacCollection {
    return {
      stac_version: '1.0.0',
      stac_extensions: [],
      type: 'Collection',
      license: 'CC-BY-4.0',
      id: 'sc_' + CliId,
      title,
      description: 'Linz Vector Basemaps.',
      extent: {
        spatial: {
          bbox: [bbBox],
        },
        temporal: { interval: [[CliDate, null]] },
      },
      links: [
        { rel: 'self', href: './collection.json', type: 'application/json' },
        { rel: 'item', href: `./${filename}.json` },
        ...layers,
      ],
      providers,
      summaries: {},
    };
  }

  createStacCatalog(): StacCatalog {
    return {
      stac_version: '1.0.0',
      stac_extensions: [],
      type: 'Catalog',
      title: 'ETL',
      description: 'ETL process to generate LINZ Vector Basemaps',
      id: 'sl_' + CliId,
      links: [{ rel: 'self', href: './catalog.json', type: 'application/json' }],
    };
  }
}

export async function createStacFiles(
  filePaths: URL[],
  target: string,
  filename: string,
  tileMatrix: TileMatrixSet,
  title: string,
  logger: LogType,
): Promise<URL[]> {
  const bucketPath = fsa.toUrl(`${target}/vector/${Epsg.Google.toString()}/`);
  const vectorStac = new VectorStac(logger);

  // Prepare stac item links
  const bboxArr: BoundingBox[] = [];
  const layers: StacLink[] = [];
  const duplicateLayer = new Map<unknown, StacLink>();
  for (const file of filePaths) {
    const stacPath = fsa.toUrl(`${file.pathname.slice(0, -8)}.json`);
    const stac: StacItem = await fsa.readJson(stacPath);
    if (stac.bbox) bboxArr.push(Bounds.fromBbox(stac.bbox));

    const layer = zLayer.parse((stac.properties['linz_basemaps:options'] as { layer: zTypeLayer }).layer);
    const layerLink = await vectorStac.createStacLink(
      (stac.properties['linz_basemaps:options'] as { name: string }).name,
      layer,
    );

    if (duplicateLayer.has(layer.id)) {
      const duplicate = duplicateLayer.get(layer.id);
      if (JSON.stringify(duplicate) === JSON.stringify(layerLink)) continue;
      logger.warn({ layer: layer.id, layerLink, duplicate }, 'Duplicated Layer with different StacLink.');
    }
    duplicateLayer.set(layer.id, layerLink);
    layers.push(layerLink);
  }

  // Create stac item
  const stacItem = vectorStac.createStacItem(layers, filename, tileMatrix);

  // Union bbox
  const unionBound = Bounds.union(bboxArr);
  const unionBbox = unionBound.toBbox();
  stacItem.bbox = unionBbox;
  stacItem.geometry = {
    type: 'Polygon',
    coordinates: unionBound.toPolygon(),
  };

  // Create stac collection
  const stacCollection = vectorStac.createStacCollection(unionBbox, layers, filename, title);

  // Create stac catalog
  let stacCatalog = vectorStac.createStacCatalog();
  const catalogPath = new URL('catalog.json', bucketPath);
  if (await fsa.exists(catalogPath)) stacCatalog = await fsa.readJson<StacCatalog>(catalogPath);
  // Add link for new collection
  stacCatalog.links.push({
    rel: 'child',
    href: `./${CliId}/collection.json`,
    created: CliDate,
    type: 'application/json',
  });

  const item = fsa.toUrl(`tmp/${filename}.json`);
  await fsa.write(item, JSON.stringify(stacItem, null, 2));
  const collection = fsa.toUrl('tmp/collection.json');
  await fsa.write(collection, JSON.stringify(stacCollection, null, 2));
  const catalog = fsa.toUrl('tmp/catalog.json');
  await fsa.write(catalog, JSON.stringify(stacCatalog, null, 2));

  return [item, collection, catalog];
}
