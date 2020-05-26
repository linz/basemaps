import { Epsg, EpsgCode } from '@basemaps/geo';
import * as o from 'ospec';
import { TileGrid } from '../tile.grid';

function round(z: number): (n: number) => number {
    const p = 10 ** z;
    return (n: number): number => Math.round(n * p) / p;
}

o.spec('polygon', () => {
    o('fraction', () => {
        const lw = new TileGrid(Epsg.Google, { x: -20, y: -20, width: 80, height: 80 }).getLevel(10);
        o(lw.fraction([32.123456, -5.1234456]).map(round(8))).deepEquals([667.1802368, 190.41989632]);
    });

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
                [174.5439147949215, -40.97367726477828],
                [174.5439147949215, -40.974714106324576],
                [174.54254150390588, -40.974714106324576],
                [174.54254150390588, -40.97367726477828],
            ],
        ]);
    });

    o('toQuadKeyTrie minKeysize', () => {
        const tg = new TileGrid(Epsg.Google, { x: 0, y: 0, width: 100, height: 100 }).getLevel(3);
        const square = [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
            [0, 0],
        ];
        tg.extent.toWsg84.inverse = (a): any => a;
        o(tg.coverPolygon(square, 3).size).equals(64);

        o(Array.from(tg.coverPolygon(square, 2))).deepEquals([
            '00',
            '01',
            '02',
            '03',
            '10',
            '11',
            '12',
            '13',
            '20',
            '21',
            '22',
            '23',
            '30',
            '31',
            '32',
            '33',
        ]);
    });

    o('toQuadKeyTrie simple', () => {
        const tg = TileGrid.Google.getLevel(18);

        const poly = [
            [174.544582640664572, -40.973788438207819],
            [174.541391829110751, -40.977115197677954],
            [174.547013735181764, -40.982621189526625],
            [174.550812320364884, -40.977918183449262],
            [174.544582640664572, -40.973788438207819],
        ];

        const trie = tg.coverPolygon(poly, 0);

        // // /** Write to ~/tmp for debugging in qgis */
        // const { inverse } = proj4('EPSG:4326', 'EPSG:3857');
        // require('fs').writeFileSync(
        //     `${process.env.HOME}/tmp/tpoly.geojson`,
        //     JSON.stringify(GeoJson.toFeaturePolygon([poly])),
        // );
        // require('fs').writeFileSync(`${process.env.HOME}/tmp/qkt.geojson`, JSON.stringify(tg.toGeoJson(trie, inverse)));

        o(Array.from(trie)).deepEquals([
            '31133322222333303',
            '311333222223333120',
            '311333222223333122',
            '311333222223333123',
            '311333222223333201',
            '311333222223333203',
            '31133322222333321',
            '311333222223333221',
            '31133322222333323',
            '31133322222333330',
            '311333222223333310',
            '311333222223333312',
            '311333222223333313',
            '31133322222333332',
            '31133322222333333',
            '311333222232222220',
            '313111000001111011',
            '31311100000111110',
            '313111000001111110',
            '313111000001111112',
            '313111000001111120',
            '313111000001111121',
        ]);
    });

    o('toQuadKeyTrie K complex', () => {
        const poly = [
            [19429858.86076585, -5008476.232882684],
            [19430214.06028324, -5009678.631113113],
            [19430907.54505528, -5009778.631113113],
            [19430007.54505528, -5008778.631113113],
            [19430214.06028324, -5008476.232882684],
            [19429858.86076585, -5008476.232882684],
        ].map(TileGrid.Google.toWsg84.forward);

        const tg = TileGrid.Google.getLevel(18);

        const trie = tg.coverPolygon(poly);

        // // /** Write to ~/tmp for debugging in qgis */
        // const { inverse } = proj4('EPSG:4326', 'EPSG:3857');
        // require('fs').writeFileSync(
        //     `${process.env.HOME}/tmp/tpoly.geojson`,
        //     JSON.stringify(GeoJson.toFeaturePolygon([poly.map(inverse)])),
        // );
        // require('fs').writeFileSync(`${process.env.HOME}/tmp/qkt.geojson`, JSON.stringify(tg.toGeoJson(trie, inverse)));

        o(Array.from(trie)).deepEquals([
            '311333222223333021',
            '311333222223333023',
            '311333222223333030',
            '311333222223333031',
            '311333222223333032',
            '311333222223333201',
            '311333222223333210',
            '311333222223333212',
            '311333222223333213',
            '31133322222333323',
            '311333222223333320',
            '311333222223333322',
            '311333222223333323',
            '313111000001111010',
            '313111000001111011',
            '313111000001111013',
            '313111000001111031',
            '31311100000111110',
            '313111000001111110',
            '313111000001111112',
            '313111000001111113',
            '313111000001111120',
            '313111000001111121',
            '313111000001111130',
            '313111000001111131',
            '313111000010000020',
        ]);
    });

    o('toQuadKeyTrie ^ shape', () => {
        const poly = [
            [19429858.86076585, -5008476.232882684],
            [19430214.06028324, -5008476.232882684],
            [19430907.54505528, -5009778.631113113],
            [19430007.54505528, -5008778.631113113],
            [19430214.06028324, -5009678.631113113],
            [19429858.86076585, -5008476.232882684],
        ].map(TileGrid.Google.toWsg84.forward);

        const tg = TileGrid.Google.getLevel(18);

        const trie = tg.coverPolygon(poly);

        // // /** Write to ~/tmp for debugging in qgis */
        // const { inverse } = proj4('EPSG:4326', 'EPSG:3857');
        // require('fs').writeFileSync(
        //     `${process.env.HOME}/tmp/tpoly.geojson`,
        //     JSON.stringify(GeoJson.toFeaturePolygon([poly.map(inverse)])),
        // );
        // require('fs').writeFileSync(`${process.env.HOME}/tmp/qkt.geojson`, JSON.stringify(tg.toGeoJson(trie, inverse)));

        o(Array.from(trie)).deepEquals([
            '311333222223333021',
            '311333222223333023',
            '31133322222333303',
            '311333222223333122',
            '311333222223333201',
            '31133322222333321',
            '31133322222333323',
            '31133322222333330',
            '31133322222333332',
            '311333222223333330',
            '311333222223333332',
            '313111000001111010',
            '313111000001111011',
            '313111000001111013',
            '313111000001111101',
            '31311100000111111',
            '313111000001111131',
            '313111000010000020',
        ]);
    });

    o('nztm', () => {
        const Nztm2000 = TileGrid.get(EpsgCode.Nztm2000);
        const poly = [
            [1729943.4690833676, 5462326.300432792],
            [1730462.2021224778, 5462014.064809335],
            [1729786.0304065342, 5462251.966211319],
        ].map(Nztm2000.toWsg84.forward);

        const tg = Nztm2000.getLevel(14);

        const trie = tg.coverPolygon(poly);

        // // /** Write to ~/tmp for debugging in qgis */
        // const { forward: toWsg84 } = getProjection(Epsg.Nztm2000, Epsg.Wgs84)!;
        // require('fs').writeFileSync(
        //     `${process.env.HOME}/tmp/tpoly.geojson`,
        //     JSON.stringify(GeoJson.toFeaturePolygon([poly.map(toWsg84)])),
        // );
        // require('fs').writeFileSync(`${process.env.HOME}/tmp/qkt.geojson`, JSON.stringify(tg.toGeoJson(trie, toWsg84)));

        o(Array.from(trie)).deepEquals([
            '30011130023133',
            '30011130023310',
            '30011130023311',
            '30011130032022',
            '30011130032023',
            '30011130032032',
            '30011130032033',
            '30011130032200',
            '30011130032201',
            '3001113003221',
            '3001113003230',
            '30011130032312',
            '30011130032313',
            '30011130032331',
            '30011130033220',
            '30011130033221',
        ]);
    });

    o('toQuadKeyTrie full cover', () => {
        const poly = [
            [19430214.06028324, -5009376.232882684],
            [19430907.54505528, -5009778.631113113],
            [19430007.54505528, -5009478.631113113],
        ];

        const tg = TileGrid.Google.getLevel(18);

        const trie = tg.coverPolygon(poly.map(TileGrid.Google.toWsg84.forward));

        // // /** Write to ~/tmp for debugging in qgis */
        // const { inverse } = proj4('EPSG:4326', 'EPSG:3857');
        // require('fs').writeFileSync(
        //     `${process.env.HOME}/tmp/tpoly.geojson`,
        //     JSON.stringify(GeoJson.toFeaturePolygon([poly.map(inverse)])),
        // );
        // require('fs').writeFileSync(`${process.env.HOME}/tmp/qkt.geojson`, JSON.stringify(tg.toGeoJson(trie, inverse)));

        o(Array.from(trie)).deepEquals([
            '311333222223333233',
            '313111000001111010',
            '313111000001111011',
            '313111000001111013',
            '31311100000111110',
            '313111000001111112',
            '313111000001111130',
            '313111000001111131',
            '313111000010000020',
        ]);
    });

    o('whole world', () => {
        const tgl = TileGrid.Google.getLevel(2);
        const geojson = TileGrid.Google.toGeoJson(['']);

        if (geojson.features[0].geometry.type !== 'Polygon') throw new Error('expected Polygon');
        const trie = tgl.coverPolygon(geojson.features[0].geometry.coordinates[0], 1);
        o(Array.from(trie)).deepEquals(['0', '1', '2', '3']);
    });
});
