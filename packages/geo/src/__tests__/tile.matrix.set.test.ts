import { Approx } from '@basemaps/test';
import * as o from 'ospec';
import { Epsg } from '../epsg';
import { Projection } from '../projection';
import { GoogleTms } from '../tms/google';
import { Nztm2000Tms } from '../tms/nztm2000';

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
            const projection = new Projection(256);
            for (let i = 0; i < 25; i++) {
                Approx.equal(projection.getResolution(i), GoogleTms.pixelScale(i), `${i}`);
            }
        });
    });

    o.spec('sourceToPixels', () => {
        o('should match the old projection logic', () => {
            const projection = new Projection(256);
            for (let i = 0; i < 10; i++) {
                const oldP = projection.getPixelsFromMeters(i, i, i);
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
});
