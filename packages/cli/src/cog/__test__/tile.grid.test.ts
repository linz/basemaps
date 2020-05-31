import { Epsg } from '@basemaps/geo';
import * as o from 'ospec';
import { TileGrid } from '../tile.grid';

o.spec('TileGrid', () => {
    o('quadKey', () => {
        const tg = TileGrid.Google;
        o(tg.quadKey(0, 0, 20)).equals('00000000000000000000');
        o(tg.quadKey(1032692, 655367, 20)).equals('31311100000111110322');
        o(tg.quadKey(1032693, 655367, 20)).equals('31311100000111110323');

        o(TileGrid.quadKeyToXyz('00000000000000000000')).deepEquals([0, 0, 20]);
        o(TileGrid.quadKeyToXyz('31311100000111110322')).deepEquals([1032692, 655367, 20]);
    });

    o('quadKeyToBbox', () => {
        const tg = new TileGrid(Epsg.Google, { x: -20, y: -20, width: 80, height: 80 });

        o(tg.quadKeyToBbox('3212011013')).deepEquals([32.109375, -5.078125, 32.1875, -5.15625]);
        o(tg.quadKeyToBbox('0')).deepEquals([-20, 60, 20, 20]);
        o(tg.quadKeyToBbox('3')).deepEquals([20, 20, 60, -20]);
        o(tg.quadKeyToBbox('30')).deepEquals([20, 20, 40, 0]);
    });

    o('toGeoJson', () => {
        const tg = TileGrid.Google;
        const geojson = tg.toGeoJson(['311333222223333030', '311333222223333031']);

        o(geojson).deepEquals({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: geojson.features[0].geometry,
                    properties: { quadKey: '311333222223333030' },
                },
                {
                    type: 'Feature',
                    geometry: geojson.features[1].geometry,
                    properties: { quadKey: '311333222223333031' },
                },
            ],
        });

        const geom = geojson.features[0].geometry as any;

        o(geom.type).equals('Polygon');

        o(geom.coordinates).deepEquals([
            [
                [174.54254150390588, -40.97367726477828],
                [174.54254150390588, -40.974714106324576],
                [174.5439147949215, -40.974714106324576],
                [174.5439147949215, -40.97367726477828],
                [174.54254150390588, -40.97367726477828],
            ],
        ]);
    });
});
