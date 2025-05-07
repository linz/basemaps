import { BoundingBox, Bounds, Epsg } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { CliId } from '@basemaps/shared/build/cli/info.js';
import { fsa } from '@chunkd/fs';
import { StacCatalog, StacCollection, StacItem, StacLink, StacProvider } from 'stac-ts';

const providers: StacProvider[] = [
  { name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor', 'host'] },
];

const projection = Epsg.Google.code;

export const Stac = {
  createStacCollection(
    creationTime: string,
    bbBox: number[],
    layers: StacLink[],
    filename: string,
    title: string,
  ): StacCollection {
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
        temporal: { interval: [[creationTime, null]] },
      },
      links: [
        { rel: 'self', href: './collection.json', type: 'application/json' },
        { rel: 'item', href: `./${filename}.json` },
        ...layers,
      ],
      providers,
      summaries: {},
    };
  },

  createStacItem(creationTime: string, layers: StacLink[], filename: string): StacItem {
    return {
      stac_version: '1.0.0',
      stac_extensions: ['https://stac-extensions.github.io/projection/v1.0.0/schema.json'],
      id: 'si_' + CliId,
      collection: filename,
      type: 'Feature',
      geometry: null,
      bbox: [-180, -90, 180, 90],
      properties: {
        'proj:epsg': projection,
        datetime: creationTime,
      },
      links: [
        { rel: 'self', href: `./${filename}.json`, type: 'application/json' },
        { rel: 'collection', href: './collection.json', type: 'application/json' },
        ...layers,
      ],
      assets: {},
    };
  },

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
  },
};

export async function createStacFiles(
  filePaths: URL[],
  target: string,
  filename: string,
  title: string,
  logger: LogType,
): Promise<void> {
  const bucketPath = fsa.toUrl(`${target}/vector/${Epsg.Google.code.toString()}`);
  const creationTime = new Date().toISOString();

  // Prepare stac item links
  const bboxArr: BoundingBox[] = [];
  const layers: StacLink[] = [];
  const duplicateLayer = new Map<unknown, StacLink>();
  for (const file of filePaths) {
    const stacPath = fsa.toUrl(`${file.pathname.slice(0, -8)}.json`);
    const stac: StacItem = await fsa.readJson(stacPath);
    if (stac.bbox) bboxArr.push(Bounds.fromBbox(stac.bbox));
    const { layer: stacLayer } = stac.properties['linz_basemaps:options'] as {
      layer: {
        id: string;
        name: string;
        title: string;
        version: string;
      };
    };
    const layerLink: StacLink = {
      rel: 'lds:layer',

      'lds:id': stacLayer.id,
      'lds:name': stacLayer.name,
      'lds:title': stacLayer.title,
      'lds:feature_count': 0,
      'lds:version': stacLayer.version,
      'basemaps:layers': [],
      href: `https://data.linz.govt.nz/services/api/v1/layers/${stacLayer.id}/versions/${stacLayer.version}/`,
    };
    if (duplicateLayer.has(stac.properties['lds:id'])) {
      const duplicate = duplicateLayer.get(stac.properties['lds:id']);
      if (JSON.stringify(duplicate) === JSON.stringify(layerLink)) continue;
      logger.warn({ layer: stacLayer.id, layerLink, duplicate }, 'Duplicated Layer with different StacLink.');
    }
    duplicateLayer.set(stac.properties['lds:id'], layerLink);
    layers.push(layerLink);
  }

  // Create stac item
  const stacItem = Stac.createStacItem(creationTime, layers, filename);

  // Union bbox
  const unionBound = Bounds.union(bboxArr);
  const unionBbox = unionBound.toBbox();
  stacItem.bbox = unionBbox;
  stacItem.geometry = {
    type: 'Polygon',
    coordinates: unionBound.toPolygon(),
  };

  // Create stac collection
  const stacCollection = Stac.createStacCollection(creationTime, unionBbox, layers, filename, title);

  // Create stac catalog
  let stacCatalog = Stac.createStacCatalog();
  const catalogPath = fsa.toUrl(`${bucketPath.href}/catalog.json`);
  if (await fsa.exists(catalogPath)) stacCatalog = await fsa.readJson<StacCatalog>(catalogPath);
  // eslint-disable-next-line no-console
  console.log(catalogPath);
  // Add link for new collection
  stacCatalog.links.push({
    rel: 'child',
    href: `./${CliId}/collection.json`,
    created: creationTime,
    type: 'application/json',
  });

  await fsa.write(fsa.toUrl(`tmp/${filename}.json`), JSON.stringify(stacItem, null, 2));
  await fsa.write(fsa.toUrl('tmp/collection.json'), JSON.stringify(stacCollection, null, 2));
  await fsa.write(fsa.toUrl('tmp/catalog.json'), JSON.stringify(stacCatalog, null, 2));
}
