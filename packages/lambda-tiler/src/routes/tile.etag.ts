import { Composition } from '@basemaps/tiler';
import { createHash } from 'crypto';
import { TileDataXyz } from '@basemaps/shared';

export const TileEtag = {
    // To force a full cache invalidation change this number
    RenderId: 1,

    /** Generate a unique ETag for this tile */
    generate(compositions: Composition[], xyz: TileDataXyz): string {
        // We cannot serialize the CogTiff inside of composition so replace it with the source name
        const layers = compositions.map((c) => {
            return { ...c, tiff: c.tiff.source.name };
        });
        const cacheKey = createHash('sha256')
            .update(JSON.stringify({ xyz, layers, RenderId: TileEtag.RenderId }))
            .digest('base64');

        return cacheKey;
    },
};
