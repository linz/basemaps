import { Epsg, EpsgCode } from '@basemaps/geo';
import * as o from 'ospec';
import { GeoJson } from '@basemaps/geo';
import { writeFileSync } from 'fs';
import { QuadTrie } from '../quad.trie';
import { TileGrid } from '../tile.grid';
import { TileCover } from '../tile.cover';

function round(z: number): (n: number) => number {
    const p = 10 ** z;
    return (n: number): number => Math.round(n * p) / p;
}

const DebugPolys = false;

/** Write to ~/tmp for debugging in qgis */
function writeDebugPolys(poly: number[][], trie: QuadTrie, tg = TileGrid.Google): void {
    if (!DebugPolys) return;
    writeFileSync(`${process.env.HOME}/tmp/poly.geojson`, JSON.stringify(GeoJson.toFeaturePolygon([poly])));
    writeFileSync(`${process.env.HOME}/tmp/trie.geojson`, JSON.stringify(tg.toGeoJson(trie)));
}

o.spec('TileCover', () => {
    o('fraction', () => {
        const lw = new TileCover(new TileGrid(Epsg.Google, { x: -20, y: -20, width: 80, height: 80 }), 10);
        o(lw.fraction([32.123456, -5.1234456]).map(round(8))).deepEquals([667.1802368, 190.41989632]);
    });

    o('toQuadTrie minKeysize', () => {
        const tg = new TileCover(new TileGrid(Epsg.Google, { x: 0, y: 0, width: 100, height: 100 }), 3);
        const square = [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
            [0, 0],
        ];
        tg.extent.toWsg84.inverse = (a): any => a;
        const trie = tg.coverPolygon(square);
        o(trie.size).equals(1);
        o(Array.from(trie)).deepEquals(['']);
    });

    o('toQuadTrie simple', () => {
        const tg = new TileCover(TileGrid.Google, 18);

        const poly = [
            [174.544582640664572, -40.973788438207819],
            [174.541391829110751, -40.977115197677954],
            [174.547013735181764, -40.982621189526625],
            [174.550812320364884, -40.977918183449262],
            [174.544582640664572, -40.973788438207819],
        ];

        const trie = tg.coverPolygon(poly);

        writeDebugPolys(poly, trie);

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

    o('toQuadTrie K complex', () => {
        const poly = [
            [19429858.86076585, -5008476.232882684],
            [19430214.06028324, -5009678.631113113],
            [19430907.54505528, -5009778.631113113],
            [19430007.54505528, -5008778.631113113],
            [19430214.06028324, -5008476.232882684],
            [19429858.86076585, -5008476.232882684],
        ].map(TileGrid.Google.toWsg84.forward);

        const tg = new TileCover(TileGrid.Google, 18);

        const trie = tg.coverPolygon(poly);

        writeDebugPolys(poly, trie);

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

    o('toQuadTrie ^ shape', () => {
        const poly = [
            [19429858.86076585, -5008476.232882684],
            [19430214.06028324, -5008476.232882684],
            [19430907.54505528, -5009778.631113113],
            [19430007.54505528, -5008778.631113113],
            [19430214.06028324, -5009678.631113113],
            [19429858.86076585, -5008476.232882684],
        ].map(TileGrid.Google.toWsg84.forward);

        const tg = new TileCover(TileGrid.Google, 18);

        const trie = tg.coverPolygon(poly);

        writeDebugPolys(poly, trie);

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

        const tg = new TileCover(Nztm2000, 14);

        const trie = tg.coverPolygon(poly);

        writeDebugPolys(poly, trie, Nztm2000);

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
            '30011130032330',
            '30011130032331',
            '30011130033220',
            '30011130033221',
        ]);
    });

    o.spec('toQuadTrie edge cases', () => {
        const Z = 18;
        function makePoly(poly: number[][]): number[][] {
            return poly.map(([x, y]) => TileGrid.Google.toWsg84.forward([x * 100 + 19430000, y * 100 - 5008000]));
        }

        function coverRect(x1: number, y1: number, x2: number, y2: number, z = Z): QuadTrie {
            const aoi = new QuadTrie();

            for (let row = y1; row < y2; ++row) {
                aoi.fillRow(x1, x2, row, z);
            }

            return aoi;
        }

        function makeAns(poly: number[][], aoi?: QuadTrie, z = Z): string[] {
            const tg = new TileCover(TileGrid.Google, z);

            const trie = tg.coverPolygon(poly);
            const ans = aoi == null ? trie : trie.clone().intersection(aoi);
            writeDebugPolys(poly, trie);
            return Array.from(ans);
        }

        function makeExp(rows: number[][], z = Z): string[] {
            const trie = new QuadTrie();

            for (const [fx, tx, y] of rows) {
                trie.fillRow(fx, tx, y, z);
            }

            return Array.from(trie);
        }

        o('bottom left rising one to right', () => {
            const poly = makePoly([
                [0, 0],
                [25, 0],
                [25, -13],
                [0, -14],
            ]);
            const aoi = coverRect(258170, 98300, 258186, 98305);

            o(makeAns(poly, aoi)).deepEquals(
                makeExp([
                    [258170, 258173, 98303],
                    [258170, 258186, 98304],
                ]),
            );
        });

        o('bottom right rising one to left', () => {
            const poly = makePoly([
                [25, 0],
                [0, 0],
                [0, -13],
                [25, -14],
            ]);
            const aoi = coverRect(258170, 98300, 258186, 98305);

            o(makeAns(poly, aoi)).deepEquals(
                makeExp([
                    [258182, 258186, 98303],
                    [258170, 258186, 98304],
                ]),
            );
        });

        o('top right decending one to left', () => {
            const poly = makePoly([
                [25, 0],
                [0, 0],
                [0, 13],
                [25, 14],
            ]);
            const aoi = coverRect(258170, 98321, 258186, 98323);

            o(makeAns(poly, aoi)).deepEquals(
                makeExp([
                    [258182, 258186, 98322],
                    [258170, 258186, 98321],
                ]),
            );
        });

        o('top left decending one to right', () => {
            const poly = makePoly([
                [0, 0],
                [25, 0],
                [25, 13],
                [0, 14],
            ]);

            o(makeAns(poly, coverRect(258170, 98313, 258186, 98314))).deepEquals(makeExp([[258170, 258186, 98313]]));
            o(makeAns(poly, coverRect(258170, 98321, 258186, 98323))).deepEquals(
                makeExp([
                    [258170, 258174, 98322],
                    [258170, 258186, 98321],
                ]),
            );
        });

        o('square', () => {
            const poly = makePoly([
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
            ]);

            o(makeAns(poly)).deepEquals([
                '31133322222333101',
                '31133322222333103',
                '3113332222233311',
                '31133322222333121',
                '311333222223331230',
                '311333222223331231',
                '31133322222333130',
                '31133322222333131',
                '311333222223331320',
                '311333222223331321',
                '311333222223331330',
                '311333222223331331',
                '311333222232220000',
                '311333222232220002',
                '311333222232220020',
                '311333222232220022',
                '311333222232220200',
                '311333222232220202',
                '311333222232220220',
            ]);
        });
    });

    o('whole world', () => {
        const tgl = new TileCover(TileGrid.Google, 2);
        const geojson = TileGrid.Google.toGeoJson(['']);

        if (geojson.features[0].geometry.type !== 'Polygon') throw new Error('expected Polygon');
        const trie = tgl.coverPolygon(geojson.features[0].geometry.coordinates[0]);
        o(Array.from(trie)).deepEquals(['']);
    });
});
