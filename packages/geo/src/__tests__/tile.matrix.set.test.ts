import * as o from 'ospec';
import { GoogleTms } from '../tms/google';
import { Projection } from '../projection';
import { Epsg } from '../epsg';
import { approxEqual } from '@basemaps/test';

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
                approxEqual(projection.getResolution(i), GoogleTms.pixelScale(i), `${i}`);
            }
        });
    });

    o.spec('sourceToPixels', () => {
        o('should match the old projection logic', () => {
            const projection = new Projection(256);
            for (let i = 0; i < 25; i++) {
                const oldP = projection.getPixelsFromMeters(i, i, i);
                const newP = GoogleTms.sourceToPixels(i, i, i);
                approxEqual(oldP.x, newP.x, `x_${i}`);
                approxEqual(oldP.y, newP.y, `y_${i}`);
            }
        });
    });

    o.spec('pixelsToSource', () => {
        o('should round trip', () => {
            for (let i = 3; i < 1000; i += 13) {
                const z = i % 20;
                const pixels = GoogleTms.sourceToPixels(i, i, z);
                const source = GoogleTms.pixelsToSource(pixels.x, pixels.y, z);

                approxEqual(source.x, i, `x${i}_z${z}`, 1e-5);
                approxEqual(source.y, i, `y${i}_z${z}`, 1e-5);
            }
        });
    });

    o.spec('tileToPixels', () => {
        o('should convert to pixels', () => {
            o(GoogleTms.tileToPixels(1, 1)).deepEquals({ x: 256, y: 256 });
            o(GoogleTms.tileToPixels(2, 2)).deepEquals({ x: 512, y: 512 });
            o(GoogleTms.tileToPixels(4, 0)).deepEquals({ x: 1024, y: 0 });
            o(GoogleTms.tileToPixels(0, 4)).deepEquals({ x: 0, y: 1024 });
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
