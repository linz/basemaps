import { Bounds, Tile, TileMatrixSet } from '@basemaps/geo';
import {
    extractYearRangeFromName,
    LogType,
    ProjectionTileMatrixSet,
    StacCollection,
    StacItem,
    StacLicense,
    StacLink,
    titleizeImageryName,
} from '@basemaps/shared';
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
async function createItem(bm: BathyMaker, tile: Tile, logger: LogType): Promise<StacItem> {
    const { tms } = bm.config;
    const tileId = TileMatrixSet.tileToName(tile);
    const outputTiffPath = bm.file.name(FileType.Output, tileId);
    const ptms = ProjectionTileMatrixSet.get(tms.projection.code);

    const bbox = ptms.tileToWgs84Bbox(tile);
    const { geometry } = ptms.proj.boundsToGeoJsonFeature(tms.tileToSourceBounds(tile));

    const created = new Date().toISOString();
    return {
        stac_version: '1.0.0',
        stac_extensions: ['proj', 'linz'],
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
        links: [
            { rel: 'collection', href: 'collection.json' },
            {
                rel: 'derived_from',
                href: bm.fileName,
                'checksum:multihash': await bm.createSourceHash(logger),
            },
            {
                rel: 'derived_from',
                href: (packageJson.repository.url ?? packageJson.repository) + '#' + getCommitHash(),
                version: packageJson.version,
            },
        ],
    };
}

/**
 * Build a collection.json for the created files

 * @param bm build config
 * @param bounds the extent of the output
 * @param itemNames the names of the stac item json files
 */
function createCollection(bm: BathyMaker, bounds: Bounds, itemNames: string[]): StacCollection {
    const { tms } = bm.config;
    const ptms = ProjectionTileMatrixSet.get(tms.projection.code);
    const bbox = ptms.proj.boundsToWgs84BoundingBox(bounds);
    const interval: [string, string][] = [];
    const name = basename(bm.config.path);
    const years = extractYearRangeFromName(name);

    // Derive title from file name
    const title = titleizeImageryName(name.replace(/\.[^.]+$/, ''));
    if (years[0] != -1) {
        interval.push(years.map((y) => `${y}-01-01T00:00:00Z`) as [string, string]);
    }

    const links: StacLink[] = [];

    for (const name of itemNames) {
        links.push({ rel: 'item', href: name, type: 'application/geo+json' });
    }

    return {
        stac_version: '1.0.0',
        stac_extensions: ['proj'],
        id: bm.config.id,
        title,
        extent: {
            spatial: {
                bbox,
            },
            temporal: { interval },
        },
        license: StacLicense,
        links,
        providers: [{ name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor'] }],
        keywords: ['Bathymetry'],
        summaries: { 'proj:epsg': [bm.config.tms.projection.code] },
    };
}

export const Stac = { createItem, createCollection };
