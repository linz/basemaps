import { NamedBounds, BoundingBox, EpsgCode } from '@basemaps/geo';
import { BaseConfig } from './base';

export interface ConfigImagery extends BaseConfig {
    projection: EpsgCode;

    /** The location of the COGs like s3://basemaps-cogs/3857/aerial/jobId123 */
    uri: string;

    /** Year the imagery was acquired */
    year: number;

    /** Resolution of imagery in MM */
    resolution: number;

    /** the bounding box of all the COGs */
    bounds: BoundingBox;

    /** list of file basenames and their bounding box */
    files: NamedBounds[];
}
