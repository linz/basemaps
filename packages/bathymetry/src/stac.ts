import { Tile, TileMatrixSet } from '@basemaps/geo';
import { LogType, ProjectionTileMatrixSet } from '@basemaps/shared';
import * as cp from 'child_process';
import * as path from 'path';
import { BathyMaker } from './bathy.maker';
import { FileType } from './file';
import { Hash } from './hash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

function getCommitHash(): string {
    return packageJson.gitHead ?? cp.execSync('git rev-parse HEAD').toString().trim();
}

/** Write some basic metadata about how the file was created*/
async function create(bm: BathyMaker, tile: Tile, logger: LogType): Promise<Record<string, unknown>> {
    const tms = bm.config.tms;
    const tileId = TileMatrixSet.tileToName(tile);
    const outputTiffPath = bm.file.name(FileType.Output, tileId);
    const ptms = ProjectionTileMatrixSet.get(tms.projection.code);

    const bounds = ptms.tileToWgs84Bbox(tile);
    const { geometry } = ptms.proj.boundsToGeoJsonFeature(tms.tileToSourceBounds(tile));

    const created = new Date().toISOString();
    return {
        stac_version: '1.0.0',
        stac_extensions: ['proj', 'linz'],
        id: tileId,
        type: 'Feature',
        bounds,
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
                type: 'image/vnd.stac.geotiff',
            },
        },
        links: [
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

export const Stac = { create };
