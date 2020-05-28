import { Epsg } from '@basemaps/geo';
import { FileConfig } from '@basemaps/lambda-shared';
import { GdalCogBuilderOptionsResampling } from '../gdal/gdal.config';

export const MaxConcurrencyDefault = 50;

export interface JobCreationContext {
    /** Source config */
    source: FileConfig;

    /** Output config */
    output: FileConfig;

    /** Should the imagery be cut to a cutline */
    cutline?: {
        source: string;
        blend: number;
    };

    targetProjection: Epsg;

    override?: {
        /** Override job id */
        id?: string;

        /**
         * Image quality
         * @default GdalCogBuilderDefaults.quality
         */
        quality?: number;

        /**
         * Number of threads to use for fetches
         * @default MaxConcurrencyDefault
         */
        concurrency?: number;

        /**
         * Override the source projection
         */
        projection?: Epsg;

        /**
         * Resampling method
         * @Default  GdalCogBuilderDefaults.resampling
         */
        resampling?: GdalCogBuilderOptionsResampling;
    };

    /**
     * Should this job be submitted to batch now?
     * @default false
     */
    batch?: boolean;

    /**
     * Should this job create a vrt
     * @default false
     */
    generateVrt?: boolean;
}
