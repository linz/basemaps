import { EpsgCode, StacCollection, StacItem } from '@basemaps/geo';
import { CogGdalSettings } from './types.js';

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

export const CogStacKeywords = ['Imagery', 'New Zealand'];
export const CogStacItemExtensions = ['projection'];

/** STAC compliant structure for storing Job instructions */
export type CogStac = StacCollection<CogSummaries>;

export interface CogStacItemProperties {
    datetime: string;
    gsd: number;
    'proj:epsg': EpsgCode;
}

export type CogStacItem = StacItem<CogStacItemProperties>;
