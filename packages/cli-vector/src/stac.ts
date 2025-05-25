import { BoundingBox, Bounds, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { StacCollection, StacItem, StacLink } from 'stac-ts';

import { LDS_CACHE_BUCKET } from './extract.js';
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
}
