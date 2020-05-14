import { EPSG, QuadKeyTrie } from '@basemaps/geo';
import { FileConfig } from '@basemaps/lambda-shared';
import { GdalCogBuilderOptionsResampling } from '../gdal/gdal.config';
import { VrtOptions } from './cog.vrt';

export interface CogJob {
    /**
     * Job Version
     *
     * follows semver, all major versions should be backwards compatible
     * @example 1.0.0
     */
    v: string;

    /** Unique processing Id */
    id: string;

    /** Imagery set name */
    name: string;

    /** Output projection */
    projection: EPSG.Google;

    source: {
        /** List of input files */
        files: string[];

        /** Configuration for accessing files */
        config: FileConfig;

        /**
         * The google zoom level that corresponds approximately what the resolution of the source  is
         * for high quality aerial imagery this is generally 20-22
         */
        resolution: number;

        /** EPSG input projection */
        projection: EPSG;
    };

    /** Folder/S3 bucket to store the output */
    output: FileConfig;

    override: {
        /**
         * Override resampling method
         * @see GdalCogBuilderDefaults.resampling
         */
        resampling?: GdalCogBuilderOptionsResampling;

        /**
         * No data value
         *
         * @default undefined
         */
        nodata?: number;

        /**
         * Quality level to use
         * @default 90
         */
        quality?: number;

        /**
         * Cutline options
         */
        cutline?: {
            source: string;
            blend: number;
        };

        vrt?: VrtOptions;
    };

    /** List of quadkeys to generate */
    quadkeys: string[];

    /** How and when this job file was generated */
    generated: {
        /** ISO date string */
        date: string;
        /** Package name of the generator */
        package: string;
        /* Version of the generator */
        version: string;
        /** Commit hash of the generator */
        hash: string | undefined;
    };
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
