import o from 'ospec';
import { TileMakerSharp } from '..';

o.spec('tile-sharp/index', () => {
    o.spec('TileMakerSharp.composeTile', () => {
        o('should ignore empty images', async () => {
            const sharp = new TileMakerSharp(256) as any;
            const tile = { bytes: [] };
            o(
                await sharp.composeTile({
                    source: { x: 0, y: 0, imageId: 1 },
                    tiff: {
                        getTile(): any {
                            return tile;
                        },
                    },
                }),
            ).equals(null);
        });
    });
});
