import { Env } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { Mosaics } from './imagery/mosaics';
import { MosaicCog } from './tiff.mosaic';

import './imagery';

export const TiffUtil = {
    getTiffsForQuadKey(qk: string, zoom: number): CogTiff[] {
        const tiffs = TiffUtil.load();
        const output: CogTiff[] = [];
        for (const mosaic of tiffs) {
            if (zoom > mosaic.zoom.max) {
                continue;
            }

            if (zoom < mosaic.zoom.min) {
                continue;
            }

            for (const tiff of mosaic.getTiffsForQuadKey(qk)) {
                output.push(tiff);
            }
        }
        return output;
    },

    /** Load all the tiffs needed for the tiler */
    load(): MosaicCog[] {
        const bucketName = process.env[Env.CogBucket];
        if (bucketName == null) {
            throw new Error(`Invalid environment missing "${Env.CogBucket}"`);
        }
        for (const tiff of Mosaics) {
            tiff.bucket = bucketName;
        }
        return Mosaics.sort((a, b) => a.priority - b.priority);
    },
};
