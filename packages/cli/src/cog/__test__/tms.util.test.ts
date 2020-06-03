import * as o from 'ospec';
import { TmsUtil } from '../tms.util';
import { GoogleTms } from '@basemaps/geo/build/tms/google';

function round(z: number): (n: number) => number {
    const p = 10 ** z;
    return (n: number): number => Math.round(n * p) / p;
}

o.spec('TmsUtil', () => {
    o('toGeoJson', () => {
        const geojson = TmsUtil.toGeoJson(GoogleTms, ['31', '33']);

        const { features } = geojson;

        o(features.length).equals(2);

        o(features[0].properties).deepEquals({ quadKey: '31' });
        o(features[1].properties).deepEquals({ quadKey: '33' });
        const { geometry } = features[0]!;
        const coords = geometry.type === 'Polygon' ? geometry.coordinates : null;
        o(coords![0].map((p) => p.map(round(8)))).deepEquals([
            [90, -66.51326044],
            [90, 0],
            [180, 0],
            [180, -66.51326044],
            [90, -66.51326044],
        ]);
    });
});
