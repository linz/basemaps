import { EPSG, QuadKeyTrie } from '@basemaps/geo';
import { FileConfig } from '@basemaps/lambda-shared';
import { GdalCogBuilderOptionsResampling } from '../gdal/gdal.config';
import { VrtOptions } from './cog.vrt';

export interface CogJob {
    /** Unique processing Id */
    id: string;

    /** Imagery set name */
    name: string;

    /** Output projection */
    projection: EPSG.Google;

    source: {
        /** List of input files */
        files: string[];
        /**
         * The google zoom level that corresponds approximately what the resolution of the source  is
         * for high quality aerial imagery this is generally 20-22
         */
        resolution: number;
        /** EPSG input projection number */
        projection: EPSG;

        options: {
            maxConcurrency: number;
        };
    } & FileConfig;

    /** Folder/S3 bucket to store the output */
    output: {
        resampling: GdalCogBuilderOptionsResampling;
        nodata?: number;
        /**
         * Quality level to use
         * @default 90
         */
        quality: number;

        /**
         * Cutline options
         */
        cutline?: {
            source: string;
            blend: number;
        };

        vrt: {
            options: VrtOptions;
        };
    } & FileConfig;

    /** List of quadkeys to generate */
    quadkeys: string[];
}

export interface SourceMetadata {
    /** Number of imagery bands generally RGB (3) or RGBA (4) */
    bands: number;
    /** Bounding box for polygons */
    bounds: GeoJSON.FeatureCollection;
    /** Lowest quality resolution of image */
    resolution: number;

    /** EPSG projection number */
    projection: number;

    /** GDAL_NODATA value */
    nodata?: number;
}

export interface CogBuilderMetadata extends SourceMetadata {
    /** Quadkey indexes for the covering tiles */
    covering: QuadKeyTrie;
}
