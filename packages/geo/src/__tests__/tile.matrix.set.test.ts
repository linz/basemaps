import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding';
import * as o from 'ospec';
import { Point } from '../bounds';
import { Epsg } from '../epsg';
import { QuadKey } from '../quad.key';
import { GoogleTms } from '../tms/google';
import { Nztm2000Tms } from '../tms/nztm2000';
import { TileMatrixSet } from '../tile.matrix.set';

const TileSize = 256;

const A = 6378137.0;
/** EPSG:3857 origin shift */
const OriginShift = (2 * Math.PI * A) / 2.0;
const InitialResolution = (2 * Math.PI * A) / TileSize;
function getResolution(zoom: number): number {
    return InitialResolution / (1 << zoom);
}

function getPixelsFromMeters(tX: number, tY: number, zoom: number): Point {
    const res = getResolution(zoom);
    const pX = (tX + OriginShift) / res;
    const pY = (tY + OriginShift) / res;
    return { x: pX, y: pY };
}

o.spec('TileMatrixSet', () => {
    o.spec('load', () => {
        o('should guess the projection', () => {
            o(GoogleTms.projection).equals(Epsg.Google);
        });
        o('should load all of the zoom levels', () => {
            for (let i = 0; i < GoogleTms.def.tileMatrix.length; i++) {
                o(GoogleTms.pixelScale(i) > 0).equals(true);
            }
        });
    });

    o.spec('pixelScale', () => {
        o('should match the old projection logic', () => {
            for (let i = 0; i < 25; i++) {
                Approx.equal(getResolution(i), GoogleTms.pixelScale(i), `${i}`);
            }
        });
    });

    o.spec('sourceToPixels', () => {
        o('should match the old projection logic', () => {
            for (let i = 0; i < 10; i++) {
                const oldP = getPixelsFromMeters(i, i, i);
                const newP = GoogleTms.sourceToPixels(i, i, i);
                Approx.equal(oldP.x, newP.x, `x_${i}`, 0.1);
                Approx.equal(oldP.y, newP.y, `y_${i}`, 0.1);
            }
        });
    });

    o.spec('pixelsToSource', () => {
        o('should round trip', () => {
            for (let i = 3; i < 1000; i += 13) {
                const z = i % 20;
                const pixels = GoogleTms.sourceToPixels(i, i, z);
                const source = GoogleTms.pixelsToSource(pixels.x, pixels.y, z);

                Approx.equal(source.x, i, `x${i}_z${z}`, 1e-5);
                Approx.equal(source.y, i, `y${i}_z${z}`, 1e-5);
            }
        });

        o(`should pixelsToSource ${Epsg.Google.toEpsgString()}`, () => {
            const tileSize = 256;
            const googleBound = 20037508.3427892;
            for (let i = 0; i < 1; i++) {
                const extentPx = tileSize * 2 ** i;
                const centerPx = extentPx / 2;
                Approx.point(GoogleTms.pixelsToSource(centerPx, centerPx, i), { x: 0, y: 0 }, 'center');
                Approx.point(GoogleTms.pixelsToSource(extentPx, centerPx, i), { x: googleBound, y: 0 }, 'extentX');
                Approx.point(GoogleTms.pixelsToSource(centerPx, extentPx, i), { x: 0, y: -googleBound });
                Approx.point(GoogleTms.pixelsToSource(extentPx, extentPx, i), { x: googleBound, y: -googleBound });
                Approx.point(GoogleTms.pixelsToSource(0, centerPx, i), { x: -googleBound, y: 0 });
                Approx.point(GoogleTms.pixelsToSource(centerPx, 0, i), { x: 0, y: googleBound });
            }

            Approx.point(GoogleTms.pixelsToSource(0, 0, 0), { x: -googleBound, y: googleBound }, 'z0:extent:ul');
            Approx.point(GoogleTms.pixelsToSource(256, 256, 0), { x: googleBound, y: -googleBound }, 'z0:extent:lr');
        });

        o(`should pixelsToSource ${Epsg.Nztm2000.toEpsgString()}`, () => {
            // Points looked at up in QGIS
            Approx.point(Nztm2000Tms.sourceToPixels(1293759.997, 5412479.999, 0), { x: 256, y: 512 });
            Approx.point(Nztm2000Tms.pixelsToSource(256, 512, 0), { x: 1293760, y: 5412480 });

            Approx.point(Nztm2000Tms.sourceToPixels(2440639.955, 5412480.092, 1), { x: 768, y: 1024 });
            Approx.point(Nztm2000Tms.pixelsToSource(256 * 3, 256 * 4, 1), { x: 2440640, y: 5412480 });
        });
    });

    [Nztm2000Tms, GoogleTms].forEach((tms) => {
        tms.def.tileMatrix.slice(0, 2).forEach((tm, z) => {
            o(`should sourceToPixels -> pixelsToSource ${tms.projection} z:${tm.identifier}`, () => {
                const startX = tm.topLeftCorner[tms.indexX];
                const startY = tm.topLeftCorner[tms.indexY];
                const scale = tms.pixelScale(z) * tm.tileWidth;

                for (let y = 0; y < tm.matrixHeight; y++) {
                    for (let x = 0; x < tm.matrixWidth; x++) {
                        const sX = startX + x * scale;
                        const sY = startY - y * scale;
                        const pixels = tms.sourceToPixels(sX, sY, z);
                        Approx.equal(pixels.x, x * 256, 'sourceToPixels:x');
                        Approx.equal(pixels.y, y * 256, 'sourceToPixels:y');

                        const tile = tms.pixelsToSource(pixels.x, pixels.y, z);
                        Approx.equal(tile.x, sX, 'pixelsToSource:x');
                        Approx.equal(tile.y, sY, 'pixelsToSource:x');
                    }
                }
            });
        });
    });

    o.spec('tileToPixels', () => {
        o('should convert to pixels', () => {
            o(GoogleTms.tileToPixels(1, 1)).deepEquals({ x: 256, y: 256 });
            o(GoogleTms.tileToPixels(2, 2)).deepEquals({ x: 512, y: 512 });
            o(GoogleTms.tileToPixels(4, 0)).deepEquals({ x: 1024, y: 0 });
            o(GoogleTms.tileToPixels(0, 4)).deepEquals({ x: 0, y: 1024 });

            o(Nztm2000Tms.tileToPixels(1, 1)).deepEquals({ x: 256, y: 256 });
            o(Nztm2000Tms.tileToPixels(2, 2)).deepEquals({ x: 512, y: 512 });
            o(Nztm2000Tms.tileToPixels(4, 0)).deepEquals({ x: 1024, y: 0 });
            o(Nztm2000Tms.tileToPixels(0, 4)).deepEquals({ x: 0, y: 1024 });
        });
    });

    o.spec('pixelsToTile', () => {
        o('should round trip', () => {
            for (let i = 3; i < 1000; i += 13) {
                const pixels = GoogleTms.tileToPixels(i, i);
                const tile = GoogleTms.pixelsToTile(pixels.x, pixels.y, i);
                o(tile).deepEquals({ x: i, y: i, z: i });
            }
        });
    });

    o.spec('tileToSource', () => {
        o('should convert to source units', () => {
            o(GoogleTms.tileToSource({ x: 0, y: 0, z: 0 })).deepEquals({
                x: -20037508.3427892,
                y: 20037508.3427892,
            });

            o(GoogleTms.tileToSource({ x: 1, y: 1, z: 0 })).deepEquals({
                x: 20037508.342789236,
                y: -20037508.342789236,
            });

            o(GoogleTms.tileToSource(QuadKey.toTile('311331222'))).deepEquals({
                x: 19411336.207076784,
                y: -4304933.433020964,
            });
        });
    });

    o.spec('tileToSourceBounds', () => {
        o('should convert to source bounds', () => {
            o(round(GoogleTms.tileToSourceBounds({ x: 0, y: 0, z: 0 }).toJson(), 4)).deepEquals({
                x: -20037508.3428,
                y: -20037508.3428,
                width: 40075016.6856,
                height: 40075016.6856,
            });

            o(round(GoogleTms.tileToSourceBounds(QuadKey.toTile('311331222')).toJson(), 4)).deepEquals({
                x: 19411336.2071,
                y: -4383204.95,
                width: 78271.517,
                height: 78271.517,
            });
        });
    });

    o.spec('topLevelTiles', () => {
        o('should return covering tiles of level 0 extent', () => {
            o(Array.from(GoogleTms.topLevelTiles())).deepEquals([{ x: 0, y: 0, z: 0 }]);
            o(Array.from(Nztm2000Tms.topLevelTiles())).deepEquals([
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 1, y: 1, z: 0 },
                { x: 0, y: 2, z: 0 },
                { x: 1, y: 2, z: 0 },
                { x: 0, y: 3, z: 0 },
                { x: 1, y: 3, z: 0 },
            ]);
        });
    });

    o.spec('tileToName nameToTile', () => {
        o('should make a name of the tile z,x,y', () => {
            o(TileMatrixSet.tileToName({ x: 4, y: 5, z: 6 })).equals('6-4-5');
            o(TileMatrixSet.nameToTile('6-4-5')).deepEquals({ x: 4, y: 5, z: 6 });
        });
    });

    o.spec('coverTile', () => {
        o('should return covering tiles of level n extent', () => {
            o(Array.from(GoogleTms.coverTile({ x: 2, y: 3, z: 3 }))).deepEquals([
                { x: 4, y: 6, z: 4 },
                { x: 5, y: 6, z: 4 },
                { x: 4, y: 7, z: 4 },
                { x: 5, y: 7, z: 4 },
            ]);
            o(Array.from(Nztm2000Tms.coverTile({ x: 2, y: 3, z: 8 }))).deepEquals([
                { x: 4, y: 6, z: 9 },
                { x: 5, y: 6, z: 9 },
                { x: 4, y: 7, z: 9 },
                { x: 5, y: 7, z: 9 },
            ]);
            o(Array.from(Nztm2000Tms.coverTile({ x: 2, y: 3, z: 7 }))).deepEquals([
                { x: 5, y: 7, z: 8 },
                { x: 6, y: 7, z: 8 },
                { x: 7, y: 7, z: 8 },
                { x: 5, y: 8, z: 8 },
                { x: 6, y: 8, z: 8 },
                { x: 7, y: 8, z: 8 },
                { x: 5, y: 9, z: 8 },
                { x: 6, y: 9, z: 8 },
                { x: 7, y: 9, z: 8 },
            ]);

            o(Array.from(Nztm2000Tms.coverTile({ x: 3, y: 2, z: 7 }))).deepEquals([
                { x: 7, y: 5, z: 8 },
                { x: 8, y: 5, z: 8 },
                { x: 9, y: 5, z: 8 },
                { x: 7, y: 6, z: 8 },
                { x: 8, y: 6, z: 8 },
                { x: 9, y: 6, z: 8 },
                { x: 7, y: 7, z: 8 },
                { x: 8, y: 7, z: 8 },
                { x: 9, y: 7, z: 8 },
            ]);
        });
    });
});
