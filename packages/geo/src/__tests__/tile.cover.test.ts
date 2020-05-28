import * as o from 'ospec';
import { TileCover } from '../tile.cover';

o.spec('TileCover', () => {
    o('toGeoJson', () => {
        const geojson = TileCover.toGeoJson(['31', '33']);

        const { features } = geojson;

        o(features.length).equals(2);

        o(features[0].properties).deepEquals({ quadKey: '31' });
        o(features[1].properties).deepEquals({ quadKey: '33' });
        const { geometry } = features[0]!;
        const coords = geometry.type === 'Polygon' ? geometry.coordinates : null;
        o(coords!).deepEquals([
            [
                [90, -66.51326044311186],
                [180, -66.51326044311186],
                [180, 0],
                [90, 0],
                [90, -66.51326044311186],
            ],
        ]);
    });
});
