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
    o('create', async () => {
        (Hash as any).hash = (v: string): string => 'hash' + v;

        const logger = LogConfig.get();

        function name(a: string, b: string): string {
            return a + '/' + b;
        }

        const bm = {
            config: { tms: GoogleTms },
            file: { name },
            fileName: 'test-file.nc',
            createSourceHash(l: LogType) {
                return 'multihashResult' + (l === logger);
            },
        } as any;

        const now = Date.now();

        const stac = round((await Stac.create(bm, { x: 22, y: 33, z: 13 }, logger)) as any);

        const date = Date.parse(stac.properties.datetime);

        o(date >= now && date < now + 2000).equals(true);
        o(/git@github\.com:linz\/basemaps.git#/.test(stac.links[1].href)).equals(true);
        o(stac.links[1].rel).equals('derived_from');
        o(/^\d+\.\d+\.\d+$/.test(stac.links[1].version)).equals(true);

        o(stac).deepEquals({
            // eslint-disable-next-line @typescript-eslint/camelcase
            stac_version: '1.0.0',
            // eslint-disable-next-line @typescript-eslint/camelcase
            stac_extensions: ['proj', 'linz'],
            id: '13-22-33',
            type: 'Feature',
            bounds: [-179.03320312, 84.92054529, -178.98925781, 84.92443459],
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-179.03320312, 84.92054529],
                        [-179.03320312, 84.92443459],
                        [-178.98925781, 84.92443459],
                        [-178.98925781, 84.92054529],
                        [-179.03320312, 84.92054529],
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
                    type: 'image/vnd.stac.geotiff',
                },
            },
            links: [
                {
                    rel: 'derived_from',
                    href: 'test-file.nc',
                    'checksum:multihash': 'multihashResulttrue',
                },
                stac.links[1],
            ],
        });
    });
});
