import { EpsgCode } from '@basemaps/geo';
import { CogGdalSettings } from './types';

export interface CogGenerated {
    /** ISO date string */
    datetime: string;
    /** Package name of the generator */
    package: string;
    /* Version of the generator */
    version: string;
    /** Commit hash of the generator */
    hash: string | undefined;
}

export interface CogOutputSummery extends CogGdalSettings {
    cutlineBlend?: number;
}

export interface CogSummaries {
    'proj:epsg': EpsgCode[];
    /** Ground Sampling Distance in meters per pixel of the generated imagery */
    gsd: number[];
    'linz:output': CogOutputSummery[];
    'linz:generated': CogGenerated[];

    /** How and when this job file was generated */
}

export interface StacLink {
    rel: string;
    href: string;
    type?: string;
}

export interface StacAsset {
    href: string;
    type: string;
    roles: string[];
    title?: string;
    description?: string;
}

export interface StacProvider {
    name: string;
    roles: string[];
    url: string;
}

export const CogStacVersion = '1.0.0';
export const CogStacLicense = 'CC-BY-4.0';
export const CogStacKeywords = ['Imagery', 'New Zealand'];
export const CogStacItemExtensions = ['proj'];
export const CogStacExtensions = ['proj', 'linz'];

export interface StacObject {
    /** Unique processing Id */
    id: string;

    stac_version: string;

    links: StacLink[];

    stac_extensions?: string[];
}

export interface StacCollection<S = Record<string, any>> extends StacObject {
    title: string;
    description?: string;

    license: string;

    extent: {
        spatial: {
            bbox: [number, number, number, number];
        };
        temporal?: {
            interval: [string, string][];
        };
    };

    keywords?: string[];

    providers?: StacProvider[];

    summaries: S;
}

/** STAC compliant structure for storing Job instructions */
export type CogStac = StacCollection<CogSummaries>;

export interface StacItemProperties {
    gsd: number;
    'proj:epsg': EpsgCode;
}

export interface CogStacItem extends StacObject, GeoJSON.Feature<GeoJSON.Geometry, StacItemProperties> {
    id: string;
    collection: string;
    links: StacLink[];
    assets: Record<string, StacAsset>;
}
