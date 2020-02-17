import { BoundingBox, Size } from '@basemaps/geo';
import { Metrics } from '@basemaps/metrics';

export interface TileMaker {
    compose(composition: Composition[]): Promise<{ buffer: Buffer; metrics: Metrics }>;
}

export interface Composition {
    /** Tiff Id */
    id: string;
    /** Image buffer */
    getBuffer: () => Promise<Buffer>;
    /** Point to draw the image at on the output bounds */
    x: number;
    y: number;
    /** Crop the initial bounds */
    extract?: Size;
    /** Resize the buffer */
    resize?: Size;
    /** Crop after the resize */
    crop?: BoundingBox;
}
