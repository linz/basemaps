import { BoundingBox, EpsgCode, NamedBounds, TileMatrixSet } from '@basemaps/geo';
import { FileConfig } from '@basemaps/shared';
import { GdalCogBuilderResampling } from '../gdal/gdal.config.js';

export interface FeatureCollectionWithCrs extends GeoJSON.FeatureCollection {
    crs: {
        type: string;
        properties: {
            name: string;
        };
    };
}

export interface ImageryProperties {
    /** Ground Sampling Distance in meters per pixel */
    gsd: number;

    /** File access details */
    location: FileConfig;

    /** List of input files */
    files: NamedBounds[];
}

export interface CogSourceProperties extends ImageryProperties {
    epsg: EpsgCode;
}

export interface CogGdalSettings {
    resampling: GdalCogBuilderResampling;
    nodata?: number;
    /**
     * Quality level to use
     * @default 90
     */
    quality: number;

    /** Vrts will add a second alpha layer if one exists, so dont always add one */
    addAlpha: boolean;
}

export interface CogOutputProperties extends CogGdalSettings, ImageryProperties {
    /** The bounds of all the cogs */
    bounds: BoundingBox;

    /** Identifier of the tile matrix to use */
    tileMatrix?: string;
    epsg: EpsgCode;

    /** Cutline options */
    cutline?: {
        href: string;
        blend: number;
    };

    /** Should this job ignore source coverage and just produce one big COG for EPSG extent */
    oneCogCovering: boolean;
}

export interface CogJobJson {
    /** Unique processing Id */
    id: string;
    /** Imagery set name */
    name: string;

    title: string;
    description?: string;

    source: CogSourceProperties;
    output: CogOutputProperties;
}

export interface CogJob extends CogJobJson {
    tileMatrix: TileMatrixSet;
    targetZoom: number;

    getJobPath(key?: string): string;
}

export interface SourceMetadata {
    /** Number of imagery bands generally RGB (3) or RGBA (4) */
    bands: number;
    /** Bounding box for polygons */
    bounds: NamedBounds[];

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
