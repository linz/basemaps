import { EPSG } from '@basemaps/geo';
import { CogTiff } from '@cogeotiff/core';
import { Mosaics } from './mosaics';

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

    /** Year the imagery was acquired */
    year: number;

    /** Resolution of imagery in MM */
    resolution: number;

    /** Imagery projection */
    projection: EPSG;

    /** Imagery set name */
    name: string;

    /** list of quad keys the imagery contains */
    quadKeys: string[];

    /** Unique imagery id */
    id: string;
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
    year: number;
    resolution: number;
    zoom = { min: 0, max: 32 };
    projection: EPSG;
    name: string;
    id: string;
    createdAt: number;
    updatedAt: number;

    constructor(opts: MosaicCogOptions) {
        this.sources = new Map();
        this.zoom.min = opts.minZoom ?? 0;
        this.zoom.max = opts.maxZoom ?? 32;
        this.priority = opts.priority ?? 100;

        this.year = opts.year;
        this.resolution = opts.resolution;
        this.projection = opts.projection;
        this.name = opts.name;
        this.id = opts.id;
        this.basePath = [this.projection, this.name, this.id].join('/');
        this.quadKeys = opts.quadKeys;
    }

    static create(opts: MosaicCogOptions): void {
        Mosaics.push(new MosaicCog(opts));
    }
}
