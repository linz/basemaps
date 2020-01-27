import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogTiff } from '@cogeotiff/core';
import { Env, QuadKey } from '@basemaps/shared';
import * as path from 'path';
import { Mosaics } from './imagery';

export interface MosaicCogOptions {
    /** Minimal zoom to show the layer @default 0 */
    minZoom?: number;
    /** Max zoom to show the layer @default 32 */
    maxZoom?: number;
    /**
     * Priority for layering
     * lower means layered first
     * @default 100
     */
    priority?: number;
}

/**
 * Collections of COGs representing a imagery set
 *
 * All COGs should be QuadKey aligned which allows for efficent searching for required COGs
 *
 * @see GdalCogDriver https://gdal.org/drivers/raster/cog.html
 */
export class MosaicCog {
    basePath: string;
    bucket: string;
    quadKeys: string[];
    sources: Map<string, CogTiff>;
    priority: number;
    zoom = { min: 0, max: 32 };

    constructor(basePath: string, quadKeys: string[], opts: MosaicCogOptions = {}) {
        this.basePath = basePath;
        this.quadKeys = quadKeys;
        this.sources = new Map();
        this.zoom.min = opts.minZoom ?? 0;
        this.zoom.max = opts.maxZoom ?? 32;
        this.priority = opts.priority ?? 100;
    }

    getSource(quadKey: string): CogTiff {
        let existing = this.sources.get(quadKey);
        if (existing == null) {
            if (!this.quadKeys.includes(quadKey)) {
                throw new Error(`QuadKey: ${quadKey} not found in source`);
            }
            existing = new CogTiff(new CogSourceAwsS3(this.bucket, path.join(this.basePath, `${quadKey}.tiff`)));
            this.sources.set(quadKey, existing);
        }
        return existing;
    }

    getTiffsForQuadKey(qk: string): CogTiff[] {
        const output: CogTiff[] = [];
        for (const tiffQk of this.quadKeys) {
            if (QuadKey.intersects(tiffQk, qk)) {
                output.push(this.getSource(tiffQk));
            }
        }
        return output;
    }
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
        return Mosaics;
    },
};
