import { EpsgCode, BoundingBox } from '@basemaps/geo';
import { FileConfig, NamedBounds } from '@basemaps/shared';
import { GdalCogBuilderOptionsResampling } from '../gdal/gdal.config';

export interface CogJob {
    /** Unique processing Id */
    id: string;

    /** Imagery set name */
    name: string;

    /** Output projection */
    projection: EpsgCode;

    source: {
        /** List of input files */
        files: string[];

        /** The number of pixels per meter for the best source image */
        pixelScale: number;
        /**
         * The zoom level that corresponds approximately what the pixelScale of the source is
         * for high quality aerial imagery this is generally 20-22 in Google Mercator
         */
        resZoom: number;
        /** EPSG input projection number */
        projection: EpsgCode;

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
            /** Vrts will add a second alpha layer if one exists, so dont always add one */
            addAlpha: boolean;
        };
    } & FileConfig;

    /** The bounds of all the cogs */
    bounds: BoundingBox;

    /** list of files to generate and their bounds */
    files: NamedBounds[];

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

    /** The number of pixels per meter for the best source image */
    pixelScale: number;

    /** Highest quality zoom level for the images */
    resZoom: number;

    /** EPSG projection number */
    projection: EpsgCode;

    /** GDAL_NODATA value */
    nodata?: number;
}

export interface CogBuilderMetadata extends SourceMetadata {
    /** the bounding box of all the COGs */
    targetBounds: BoundingBox;

    /** list of file basenames and their bounding box */
    files: NamedBounds[];
}
