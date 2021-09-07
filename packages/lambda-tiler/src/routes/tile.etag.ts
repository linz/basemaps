import { Composition } from '@basemaps/tiler';
import { createHash } from 'crypto';
import { TileDataXyz } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest } from '@linzjs/lambda';

export const TileEtag = {
    // To force a full cache invalidation change this number
    RenderId: 1,

    key(object: Record<string, unknown>): string {
        return createHash('sha256').update(JSON.stringify(object)).digest('base64');
    },

    /** Generate a unique ETag for this tile */
    generate(compositions: Composition[], xyzData: TileDataXyz): string {
        // We cannot serialize the CogTiff inside of composition so replace it with the source name
        const layers = compositions.map((c) => {
            return { ...c, tiff: c.tiff.source.name };
        });

        const xyz = { ...xyzData, tileMatrix: xyzData.tileMatrix.identifier };
        return TileEtag.key({ xyz, layers, RenderId: TileEtag.RenderId });
    },

    isNotModified(req: LambdaHttpRequest, cacheKey: string): boolean {
        // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our
        // etag this tile has not been modified.
        const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
        if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
            req.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
            return true;
        }
        return false;
    },
};
