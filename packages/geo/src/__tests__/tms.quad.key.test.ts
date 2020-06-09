import { GoogleTms } from '../tms/google';
import { TileMatrixSetQuadKey } from '../tms.quad.key';
import { Nztm2000Tms } from '../tms/nztm2000';
import * as o from 'ospec';
import { QuadKey } from '../quad.key';
import { Tile, TileMatrixSet } from '../tile.matrix.set';

interface SampleOpts {
    /** Percent to include between 0 - 1 */
    sample: number;
    /** Minimum number of outputs must be < maxOutput */
    minOutput: number;
    /** Max number of outputs must be > minOutput */
    maxOutput: number;
}
/**
 * Generate a random sampling of tiles for a given zoom level,
 * with at minimum all tiles or minOutput tiles being generated
 */
function* randomTileSample(
    tms: TileMatrixSet,
    z: number,
    opts: SampleOpts = { sample: 0.001, minOutput: 1000, maxOutput: 2000 },
): Generator<Tile> {
    const zoom = tms.zooms[z];
    const totalTiles = zoom.matrixHeight * zoom.matrixWidth;
    const minOutputCount = Math.min(totalTiles, opts.minOutput);
    if (opts.maxOutput <= opts.minOutput) throw new Error('Need more max output than min');
    let outputCount = 0;
    while (outputCount < minOutputCount) {
        for (let y = 0; y < zoom.matrixHeight; y++) {
            for (let x = 0; x < zoom.matrixWidth; x++) {
                if (Math.random() < opts.sample) {
                    outputCount++;
                    yield { x, y, z };

                    if (outputCount > opts.maxOutput) return;
                }
            }
        }
    }
}

o.spec('TileMatrixSetQuadKey', () => {
    const googleQk = new TileMatrixSetQuadKey(GoogleTms);
    const Nztm2000Qk = new TileMatrixSetQuadKey(Nztm2000Tms);

    function coverToQkString(tmsQk: TileMatrixSetQuadKey, qk?: string): string {
        return Array.from(tmsQk.coverTile(qk === undefined ? undefined : tmsQk.toTile(qk)))
            .map((t) => tmsQk.fromTile(t))
            .join(' ');
    }

    o.spec('GoogleTmsQk', () => {
        o('topLevelQuadKeys', () => {
            o(coverToQkString(googleQk)).equals('');
        });

        o('coverTile', () => {
            o(coverToQkString(googleQk, '')).equals('0 1 2 3');
            o(coverToQkString(googleQk, '0')).equals('00 01 02 03');
            o(coverToQkString(googleQk, '32123012')).equals('321230120 321230121 321230122 321230123');
        });

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

        o.spec('nearestQuadKeys', () => {
            o('should only ever return one quadkey for google TMS', () => {
                for (let z = 0; z < GoogleTms.zooms.length; z++) {
                    for (const tile of randomTileSample(GoogleTms, z)) {
                        const qks = googleQk.nearestQuadKeys(tile);
                        const realQuadKey = QuadKey.fromTile(tile);
                        o(qks).deepEquals([realQuadKey])(`tile : ${tile.x},${tile.y} z${tile.z}`);
                    }
                }
            });
        });
    });

    o.spec('Nztm2000Qk', () => {
        o('topLevelQuadKeys', () => {
            o(coverToQkString(Nztm2000Qk)).equals('00 01 02 03 20 21 22 23');
        });

        o('coverTile', () => {
            o(coverToQkString(Nztm2000Qk, '00')).equals('000 001 002 003');
            o(coverToQkString(Nztm2000Qk, '23012301')).equals('230123010 230123011 230123012 230123013');
        });

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

        o.spec('nearestQuadKeys', () => {
            o('should calculate nearest quad keys', () => {
                /** z8 is a werid jump 2.5x zoom not 2x which means some z8 tiles need 4 z7 tiles to cover them*/
                o(Nztm2000Qk.nearestQuadKeys({ x: 2, y: 2, z: 8 })).deepEquals([
                    '000000000',
                    '000000001',
                    '000000002',
                    '000000003',
                ]);

                o(Nztm2000Qk.nearestQuadKeys({ x: 4, y: 4, z: 8 })).deepEquals(['000000003']);
                o(Nztm2000Qk.nearestQuadKeys({ x: 7, y: 7, z: 8 })).deepEquals([
                    '000000030',
                    '000000031',
                    '000000032',
                    '000000033',
                ]);
            });

            o('should round output tiles offsets', () => {
                // This tile has a offset that rounds to .999999994, which needs to validate rounding
                const tile = { x: 1275, y: 2155, z: 9 };
                o(Nztm2000Qk.nearestQuadKeys(tile)).deepEquals(['231313333']);
            });

            o('should only calculate one tile for z9-12', () => {
                for (let z = 9; z < 12; z++) {
                    for (const tile of randomTileSample(Nztm2000Tms, z)) {
                        const qk = Nztm2000Qk.nearestQuadKeys(tile);
                        o(qk.length).equals(1)(`tile : ${tile.x},${tile.y} z${tile.z}`);
                    }
                }
            });
        });
    });
});
