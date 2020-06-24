import o from 'ospec';
import { GeoJson } from '../geo.json';

o.spec('geo.json', () => {
    const coordinates = [[[[1, 2]]], [[[3, 4]]]];
    o('toFeatureMultiPolygon', () => {
        o(GeoJson.toFeatureMultiPolygon(coordinates, { tiff: '31.tiff' })).deepEquals({
            type: 'Feature',
            geometry: { type: 'MultiPolygon', coordinates },
            properties: { tiff: '31.tiff' },
        });
    });

    o('toMultiPolygon', () => {
        o(
            GeoJson.toMultiPolygon([
                GeoJson.toFeatureMultiPolygon([[[[5, 6]]]]),
                GeoJson.toFeatureMultiPolygon(coordinates),
            ]),
        ).deepEquals({
            type: 'MultiPolygon',
            coordinates: [[[[5, 6]]], [[[1, 2]]], [[[3, 4]]]],
        });
    });
});
