import { Env } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { Mosaics } from './imagery/mosaics';
import { MosaicCog } from './tiff.mosaic';

import './imagery';

/**
 * Sort a collection of mosaics based on our predetermined priority
 *
 * This needs to be a stable sort or imagery will generate weird
 */
export function MosaicSort(a: MosaicCog, b: MosaicCog): number {
    // Sort by priority, highest on top
    if (a.priority != b.priority) {
        return a.priority - b.priority;
    }

    // Sort by year, newest on top
    if (a.year != b.year) {
        return a.year - b.year;
    }

    // Resolution, highest resolution (lowest number) on top
    if (a.resolution != b.resolution) {
        return b.resolution - a.resolution;
    }

    // If everything is equal use the name to force a stable sort
    return a.basePath.localeCompare(b.basePath);
}

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
        return Mosaics.sort(MosaicSort);
    },
};
