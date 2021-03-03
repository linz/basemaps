import {
    Bounds,
    Tile,
    TileMatrixSet,
    Stac as StacStatic,
    StacItem,
    StacCollection,
    StacLink,
    StacProvider,
} from '@basemaps/geo';
import { extractYearRangeFromName, FileOperator, LogType, Projection, titleizeImageryName } from '@basemaps/shared';
import * as cp from 'child_process';
import * as path from 'path';
import { basename } from 'path';
import { BathyMaker } from './bathy.maker';
import { FileType } from './file';
import { Hash } from './hash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

function getCommitHash(): string {
    return packageJson.gitHead ?? cp.execSync('git rev-parse HEAD').toString().trim();
}

/** Write some basic metadata about how the file was created*/
async function createItem(bm: BathyMaker, tile: Tile): Promise<StacItem> {
    const { tms } = bm.config;
    const tileId = TileMatrixSet.tileToName(tile);
    const outputTiffPath = bm.tmpFolder.name(FileType.Output, tileId);

    const bbox = Projection.tileToWgs84Bbox(tms, tile);
    const { geometry } = Projection.get(tms).boundsToGeoJsonFeature(tms.tileToSourceBounds(tile));

    const created = new Date().toISOString();
    return {
        stac_version: StacStatic.Version,
        stac_extensions: ['projection', StacStatic.BaseMapsExtension],
        id: bm.config.id + '/' + tileId,
        collection: bm.config.id,
        type: 'Feature',
        bbox,
        geometry,
        properties: {
            datetime: created,
            'checksum:multihash': await Hash.hash(outputTiffPath),
            'proj:epsg': tms.projection.code,
            'linz:gdal:version': await bm.gdalVersion,
        },
        assets: {
            tiff: {
                href: path.basename(outputTiffPath),
                title: 'GeoTiff',
                roles: ['data'],
                type: 'image/tiff; application=geotiff',
            },
        },
        links: [{ rel: 'collection', href: 'collection.json' }],
    };
}

/**
 * Build a collection.json for the created files

 * @param bm build config
 * @param bounds the extent of the output
 * @param itemNames the names of the stac item json files
 */
async function createCollection(
    bm: BathyMaker,
    bounds: Bounds,
    itemNames: string[],
    logger: LogType,
): Promise<StacCollection> {
    const { tms } = bm.config;
    // const ptms = Proj.get(tms.projection.code);
    const bbox = [Projection.get(tms).boundsToWgs84BoundingBox(bounds)];
    const name = basename(bm.inputPath);
    let description: string | undefined;

    const links: StacLink[] = [
        {
            rel: 'self',
            href: FileOperator.join(bm.outputPath, bm.tmpFolder.basename(FileType.Stac, 'collection')),
        },
        {
            rel: 'derived_from',
            href: bm.inputPath,
            'checksum:multihash': await bm.createSourceHash(logger),
        },
        {
            rel: 'derived_from',
            href: (packageJson.repository.url ?? packageJson.repository) + '#' + getCommitHash(),
            version: packageJson.version,
        },
    ];

    for (const name of itemNames) {
        links.push({ rel: 'item', href: name, type: 'application/geo+json' });
    }

    let sourceStac = {} as StacCollection;
    const providers: StacProvider[] = [
        { name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor'] },
    ];
    const interval: [string, string][] = [];
    try {
        const sourceCollectionPath = FileOperator.join(bm.inputFolder, 'collection.json');
        sourceStac = await FileOperator.readJson<StacCollection>(sourceCollectionPath);
        description = sourceStac.description;
        interval.push(...(sourceStac.extent?.temporal?.interval ?? []));
        links.push({ href: sourceCollectionPath, rel: 'sourceImagery', type: 'application/json' });
        if (sourceStac.providers != null) providers.push(...sourceStac.providers);
    } catch (err) {
        if (!FileOperator.isCompositeError(err) || err.code !== 404) {
            throw err;
        }
    }

    const title = sourceStac.title ?? titleizeImageryName(name);

    if (description == null) {
        description = 'No description';
    }

    if (interval.length === 0) {
        const years = extractYearRangeFromName(name);
        if (years[0] === -1) {
            throw new Error('Missing date in imagery name: ' + name);
        }
        interval.push(years.map((y) => `${y}-01-01T00:00:00Z`) as [string, string]);
    }

    return {
        stac_version: StacStatic.Version,
        stac_extensions: ['projection'],
        id: bm.config.id,
        title,
        description,
        extent: {
            spatial: {
                bbox,
            },
            temporal: { interval },
        },
        license: StacStatic.License,
        links,
        providers,
        keywords: ['Bathymetry'],
        summaries: { 'proj:epsg': [bm.config.tms.projection.code] },
    };
}

export const Stac = { createItem, createCollection, ...StacStatic };
