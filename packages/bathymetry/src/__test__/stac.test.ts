import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { LogConfig, LogType } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { Hash } from '../hash';
import { Stac } from '../stac';

o.spec('stac', () => {
    const origHash = Hash.hash;

    o.afterEach(() => {
        Hash.hash = origHash;
    });
    o('createItem', async () => {
        (Hash as any).hash = (v: string): string => 'hash' + v;

        const logger = LogConfig.get();

        function name(a: string, b: string): string {
            return a + '/' + b;
        }

        const bm = {
            config: { id: 'id123', tms: GoogleTms },
            file: { name },
            fileName: 'test-file.nc',
            createSourceHash(l: LogType) {
                return 'multihashResult' + (l === logger);
            },
        } as any;

        const now = Date.now();

        const stac = round((await Stac.createItem(bm, { x: 22, y: 33, z: 13 }, logger)) as any);

        const date = Date.parse(stac.properties.datetime);

        o(date >= now && date < now + 2000).equals(true);
        o(stac.links[2].href.startsWith('https://github.com/linz/basemaps.git')).equals(true);
        o(stac.links[2].rel).equals('derived_from');
        o(/^\d+\.\d+\.\d+$/.test(stac.links[2].version)).equals(true);

        o(round(stac, 4)).deepEquals({
            stac_version: '1.0.0',
            stac_extensions: ['proj', 'linz'],
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
                'checksum:multihash': 'hashoutput/13-22-33',
                'proj:epsg': 3857,
                'linz:gdal:version': undefined,
            },
            assets: {
                tiff: {
                    href: '13-22-33',
                    title: 'GeoTiff',
                    roles: ['data'],
                    type: 'image/tiff; application=geotiff',
                },
            },
            links: [
                { rel: 'collection', href: 'collection.json' },
                {
                    rel: 'derived_from',
                    href: 'test-file.nc',
                    'checksum:multihash': 'multihashResulttrue',
                },
                stac.links[2],
            ],
        });
    });

    o('createCollection', () => {
        const bm = {
            config: { id: 'id123', tms: GoogleTms, path: 'path/to/bathy_2020.nc' },
        } as any;

        const bounds = GoogleTms.tileToSourceBounds({ x: 22, y: 33, z: 13 });

        const items = ['13-22-33.json', '13-22-34.json'];
        const stac = Stac.createCollection(bm, bounds, items);

        o(round(stac, 4)).deepEquals({
            stac_version: '1.0.0',
            stac_extensions: ['proj'],
            id: 'id123',
            title: 'Bathy 2020',
            extent: {
                spatial: { bbox: [-179.0332, 84.9205, -178.9893, 84.9244] },
                temporal: { interval: [['2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z']] },
            },
            license: 'CC-BY-4.0',
            links: [
                { rel: 'item', href: '13-22-33.json', type: 'application/geo+json' },
                { rel: 'item', href: '13-22-34.json', type: 'application/geo+json' },
            ],
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
});
