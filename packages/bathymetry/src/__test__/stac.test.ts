import { GoogleTms, StacCollection } from '@basemaps/geo';
import { LogConfig, LogType } from '@basemaps/shared';
import { mockFileOperator } from '@basemaps/shared/build/file/__test__/file.operator.test.helper';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { dirname } from 'path';
import { FilePath } from '../file.js';
import { Hash } from '../hash.js';
import { Stac } from '../stac.js';

o.spec('stac', () => {
    const origHash = Hash.hash;

    const mockFs = mockFileOperator();

    o.beforeEach(mockFs.setup);

    o.afterEach(() => {
        Hash.hash = origHash;
        mockFs.teardown();
    });

    o('createItem', async () => {
        (Hash as any).hash = (v: string): string => 'hash' + v;

        const bm = {
            id: 'id123',
            tileMatrix: GoogleTms,
            inputPath: 's3://test-source-bucket/gebco-2020',
            outputPath: 's3://test-bucket/bathy-2020',
            tmpFolder: new FilePath('/tmp/path'),
        } as any;
        bm.config = bm;

        const now = Date.now();

        const stac = round((await Stac.createItem(bm, { x: 22, y: 33, z: 13 })) as any);

        const date = Date.parse(stac.properties.datetime);

        o(date >= now && date < now + 2000).equals(true);

        o(round(stac, 4)).deepEquals({
            stac_version: Stac.Version,
            stac_extensions: ['projection', Stac.BaseMapsExtension],
            id: 'id123/13-22-33',
            collection: 'id123',
            type: 'Feature',
            bbox: [-179.0332, 84.9205, -178.9893, 84.9244],
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-179.0332, 84.9205],
                        [-179.0332, 84.9244],
                        [-178.9893, 84.9244],
                        [-178.9893, 84.9205],
                        [-179.0332, 84.9205],
                    ],
                ],
            },
            properties: {
                datetime: stac.properties.datetime,
                'checksum:multihash': 'hash/tmp/path/output/13-22-33.tiff',
                'proj:epsg': 3857,
                'linz:gdal:version': undefined,
                'linz:tile_matrix_set': 'WebMercatorQuad',
            },
            assets: {
                tiff: {
                    href: '13-22-33.tiff',
                    title: 'GeoTiff',
                    roles: ['data'],
                    type: 'image/tiff; application=geotiff',
                },
            },
            links: [{ rel: 'collection', href: 'collection.json' }],
        });
    });

    o.spec('createCollection', () => {
        const logger = LogConfig.get();
        LogConfig.disable();
        const bm = {
            id: 'id123',
            tileMatrix: GoogleTms,
            inputPath: 's3://test-source-bucket/gebco-2020/gebco_2020.nc',
            outputPath: 's3://test-bucket/bathy-2020',
            tmpFolder: new FilePath('/tmp/path'),
            createSourceHash(l: LogType) {
                return 'multihashResult' + (l === logger);
            },
            get inputFolder(): string {
                return dirname(this.inputPath);
            },
        } as any;
        bm.config = bm;

        o('createCollection without source collection.json', async () => {
            const bounds = GoogleTms.tileToSourceBounds({ x: 1, y: 2, z: 4 });

            const items = ['1-1-2.json'];
            const stac = await Stac.createCollection(bm, bounds, items, logger);

            o(round(stac, 4)).deepEquals({
                stac_version: Stac.Version,
                stac_extensions: ['projection'],
                id: 'id123',
                title: 'Gebco 2020.nc',
                description: 'No description',
                extent: {
                    spatial: { bbox: [[-157.5, 74.0195, -135, 79.1713]] },
                    temporal: {
                        interval: [['2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z']],
                    },
                },
                license: Stac.License,
                links: stac.links,
                providers: [
                    {
                        name: 'Land Information New Zealand',
                        url: 'https://www.linz.govt.nz/',
                        roles: ['processor'],
                    },
                ],
                keywords: ['Bathymetry'],
                summaries: { 'proj:epsg': [3857] },
            });
        });

        o('createCollection with source collection.json', async () => {
            mockFs.jsStore['s3://test-source-bucket/gebco-2020/collection.json'] = {
                title: 'fancy title',
                description: 'collection description',
                providers: [{ name: 'source provider', roles: ['source'] }],
                extent: {
                    spatial: { bbox: [[-180, 84, -178, 85]] },
                    temporal: { interval: [['2020-01-01T00:00:00Z', '2020-10-12T01:02:03Z']] },
                },
            } as StacCollection;

            const bounds = GoogleTms.tileToSourceBounds({ x: 22, y: 33, z: 13 });

            const items = ['13-22-33.json', '13-22-34.json'];
            const stac = await Stac.createCollection(bm, bounds, items, logger);

            const gitHubLink = stac.links[2];
            o(gitHubLink.href.startsWith('https://github.com/linz/basemaps.git')).equals(true);
            o(gitHubLink.rel).equals('derived_from');
            o(/^\d+\.\d+\.\d+$/.test(gitHubLink.version as any)).equals(true);

            o(round(stac, 4)).deepEquals({
                stac_version: Stac.Version,
                stac_extensions: ['projection'],
                id: 'id123',
                title: 'fancy title',
                description: 'collection description',
                extent: {
                    spatial: { bbox: [[-179.0332, 84.9205, -178.9893, 84.9244]] },
                    temporal: { interval: [['2020-01-01T00:00:00Z', '2020-10-12T01:02:03Z']] },
                },
                license: Stac.License,
                links: [
                    {
                        rel: 'self',
                        href: 's3://test-bucket/bathy-2020/collection.json',
                    },
                    {
                        rel: 'derived_from',
                        href: 's3://test-source-bucket/gebco-2020/gebco_2020.nc',
                        'checksum:multihash': 'multihashResulttrue',
                    },
                    gitHubLink,

                    { rel: 'item', href: '13-22-33.json', type: 'application/geo+json' },
                    { rel: 'item', href: '13-22-34.json', type: 'application/geo+json' },
                    {
                        href: 's3://test-source-bucket/gebco-2020/collection.json',
                        rel: 'sourceImagery',
                        type: 'application/json',
                    },
                ],
                providers: [
                    {
                        name: 'Land Information New Zealand',
                        url: 'https://www.linz.govt.nz/',
                        roles: ['processor'],
                    },
                    { name: 'source provider', roles: ['source'] },
                ],
                keywords: ['Bathymetry'],
                summaries: { 'proj:epsg': [3857] },
            });
        });
    });
});
