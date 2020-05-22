import { BoundingBox, Size } from '@basemaps/geo';
import { Metrics } from '@basemaps/metrics';
import { CogTiff } from '@cogeotiff/core';

export interface TileMaker {
    compose(ctx: TileMakerContext): Promise<{ buffer: Buffer; metrics: Metrics }>;
}

export interface TileMakerContext {
    layers: Composition[];
    format: ImageFormat;
    background: { r: number; g: number; b: number; alpha: number };
}

export interface Composition {
    /** Tiff Id */
    tiff: CogTiff;
    /** Source tile used */
    source: {
        x: number;
        y: number;
        /** Internal tiff image used */
        imageId: number;
    };
    /** Point to draw the image at on the output bounds */
    x: number;
    y: number;
    /** Crop the initial bounds */
    extract?: Size;
    /** Resize the image */
    resize?: Size;
    /** Crop after the resize */
    crop?: BoundingBox;
}

export enum ImageFormat {
    PNG = 'png',
    JPEG = 'jpeg',
    WEBP = 'webp',
}

export const ImageFormatOrder = [ImageFormat.PNG, ImageFormat.WEBP, ImageFormat.JPEG];

/** Guess the image format based on the file extension */
export function getImageFormat(ext: string): ImageFormat | null {
    const search = ext.toLowerCase();
    if (search == 'png') {
        return ImageFormat.PNG;
    }
    if (search == 'webp') {
        return ImageFormat.WEBP;
    }
    if (search == 'jpeg' || search == 'jpg') {
        return ImageFormat.JPEG;
    }
    return null;
}
