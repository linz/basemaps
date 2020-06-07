import { GoogleTms } from '../tms/google';
import { TileMatrixSetQuadKey } from '../tms.quad.key';
import { Nztm2000Tms } from '../tms/nztm2000';
import * as o from 'ospec';
import { QuadKey } from '../quad.key';

o.spec('TileMatrixSetQuadKey', () => {
    const googleQk = new TileMatrixSetQuadKey(GoogleTms);
    const Nztm2000Qk = new TileMatrixSetQuadKey(Nztm2000Tms);

    o.spec('GoogleTmsQk', () => {
        o('toTile', () => {
            o(googleQk.toTile('')).deepEquals({ x: 0, y: 0, z: 0 });
            o(googleQk.toTile('31')).deepEquals({ x: 3, y: 2, z: 2 });
            o(googleQk.toTile('31021')).deepEquals({ x: 25, y: 18, z: 5 });
        });

        o('toTile all zooms', () => {
            for (let z = 0; z < googleQk.tms.zooms.length; z++) {
                const qk = QuadKey.fromTile({ x: 0, y: 0, z });
                o(googleQk.toTile(qk)).deepEquals({ x: 0, y: 0, z });
            }
        });

        o('fromTile', () => {
            o(googleQk.fromTile({ x: 0, y: 0, z: 0 })).equals('');
            o(googleQk.fromTile({ x: 3, y: 2, z: 2 })).equals('31');
            o(googleQk.fromTile({ x: 25, y: 18, z: 5 })).equals('31021');
            o(googleQk.fromTile({ x: 2 ** 24 - 1, y: 0, z: 24 })).equals('111111111111111111111111');
            o(googleQk.fromTile({ x: 0, y: 2 ** 24 - 1, z: 24 })).equals('222222222222222222222222');
            o(googleQk.fromTile({ x: 2 ** 24 - 1, y: 2 ** 24 - 1, z: 24 })).equals('333333333333333333333333');
        });
    });

    o.spec('Nztm2000Qk', () => {
        o('should calculate offsets', () => {
            o(Nztm2000Qk.zMax).equals(8);
            o(Nztm2000Qk.zOffset).equals(2);
        });

        o('toTile', () => {
            o(Nztm2000Qk.toTile('22')).deepEquals({ x: 0, y: 3, z: 0 });
            o(Nztm2000Qk.toTile('213')).deepEquals({ x: 3, y: 5, z: 1 });
            o(Nztm2000Qk.toTile('21021')).deepEquals({ x: 9, y: 18, z: 3 });
        });

        o('should throw if out of bounds', () => {
            o(() => Nztm2000Qk.toTile('')).throws(Error);
            o(() => Nztm2000Qk.toTile('33')).throws(Error);
            o(() => Nztm2000Qk.toTile('0'.repeat(10))).throws(Error);
            o(() => Nztm2000Qk.fromTile({ x: 0, y: 0, z: 8 })).throws(Error);
        });

        o('round trip all of z0-z8', () => {
            for (let z = 0; z < 8; z++) {
                const zoom = Nztm2000Tms.zooms[z];
                for (let x = 0; x < Math.min(zoom.matrixWidth, 25); x++) {
                    for (let y = 0; y < Math.min(zoom.matrixHeight, 25); y++) {
                        const sourceTile = { x, y, z };
                        const qk = Nztm2000Qk.fromTile(sourceTile);
                        const reverse = Nztm2000Qk.toTile(qk);
                        o(reverse).deepEquals(sourceTile);
                    }
                }
            }
        });
    });
});
