import * as o from 'ospec';
import { Projection } from '../projection';

o.spec('Projection', () => {
    const proj256 = new Projection(256);
    const proj512 = new Projection(512);

    o('should create tile sized bounds', () => {
        const bounds256 = proj256.getPixelsFromTile(1, 2);
        o(bounds256.toJson()).deepEquals({ x: 256, y: 512, width: 256, height: 256 });

        const bounds512 = proj512.getPixelsFromTile(1, 2);
        o(bounds512.toJson()).deepEquals({ x: 512, y: 1024, width: 512, height: 512 });
    });
});
