import { BoundingBox, Bounds, TileMatrixSet } from '@basemaps/geo';
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
    'linz_basemaps:options'?: VectorCreationOptions;
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
        'basemaps:layers': [targetLayer],
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
    options?: VectorCreationOptions,
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
        'linz_basemaps:generated': {
          package: CliInfo.package,
          hash: CliInfo.hash,
          version: CliInfo.version,
          datetime: CliDate,
        },
      },
      assets: {},
    };

    // Set options for individual mbtiles stac file
    if (options != null) item.properties['linz_basemaps:options'] = options;

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
  targetPath: URL,
  filename: string,
  tileMatrix: TileMatrixSet,
  title: string,
  logger: LogType,
): Promise<URL[]> {
  const vectorStac = new VectorStac(logger);

  // Prepare stac item links
  const bboxArr: BoundingBox[] = [];
  const layersMap = new Map<string, StacLink>();
  for (const file of filePaths) {
    const stacPath = fsa.toUrl(`${file.href.split('.mbtiles')[0]}.json`);
    const stac: StacItem = await fsa.readJson(stacPath);
    if (stac.bbox) bboxArr.push(Bounds.fromBbox(stac.bbox));

    const layer = zLayer.parse((stac.properties['linz_basemaps:options'] as { layer: zTypeLayer }).layer);
    const name = (stac.properties['linz_basemaps:options'] as { name: string }).name;
    const layerLink = stac.links.find((l) => l.rel === 'lds:layer' && l['lds:id'] === layer.id);
    if (layerLink == null) throw new Error(`Layer link not found for ${layer.id} in ${stacPath.href}`);

    const existing = layersMap.get(layer.id);
    if (existing != null) {
      (existing['basemaps:layers'] as string[]).push(name);
    } else {
      layersMap.set(layer.id, layerLink);
    }
  }

  const layers = Array.from(layersMap.values());
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
  const catalogPath = new URL('catalog.json', targetPath);
  if (await fsa.exists(catalogPath)) stacCatalog = await fsa.readJson<StacCatalog>(catalogPath);
  // Add link for new collection
  stacCatalog.links.push({
    rel: 'child',
    href: `./${CliId}/collection.json`,
    created: CliDate,
    type: 'application/json',
  });

  const item = fsa.toUrl(`tmp/join/${filename}.json`);
  await fsa.write(item, JSON.stringify(stacItem, null, 2));
  const collection = fsa.toUrl('tmp/join/collection.json');
  await fsa.write(collection, JSON.stringify(stacCollection, null, 2));
  const catalog = fsa.toUrl('tmp/join/catalog.json');
  await fsa.write(catalog, JSON.stringify(stacCatalog, null, 2));

  return [item, collection, catalog];
}
