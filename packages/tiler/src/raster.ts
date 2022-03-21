import { Bounds, Size } from '@basemaps/geo';
import { Metrics } from '@linzjs/metrics';
import { CogTiff } from '@cogeotiff/core';

export interface TileMaker {
  compose(ctx: TileMakerContext): Promise<{ buffer: Buffer; metrics: Metrics }>;
}

export type ResizeKernelType = 'nearest' | 'lanczos3' | 'lanczos2';
export type TileMakerResizeKernel = { in: ResizeKernelType; out: ResizeKernelType };

export interface TileMakerContext {
  layers: Composition[];
  format: ImageFormat;
  background: { r: number; g: number; b: number; alpha: number };
  resizeKernel: TileMakerResizeKernel;
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
  } & Size;
  /** Point to draw the image at on the output bounds */
  x: number;
  y: number;
  /** Crop the initial bounds */
  extract?: Size;
  /** Resize the image */
  resize?: Size & {
    /** Scale  < 1 to zoom in, > 1 to zoom out */
    scale: number;
  };
  /** Crop after the resize */
  crop?: Bounds;
}

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  AVIF = 'avif',
}

export const ImageFormatOrder = [ImageFormat.JPEG, ImageFormat.WEBP, ImageFormat.PNG];

/** Guess the image format based on the file extension */
export function getImageFormat(ext?: string): ImageFormat | null {
  if (ext == null) return null;
  const search = ext.toLowerCase();
  if (search === 'png') return ImageFormat.PNG;
  if (search === 'webp') return ImageFormat.WEBP;
  if (search === 'jpeg' || search === 'jpg') return ImageFormat.JPEG;
  if (search === 'avif') return ImageFormat.AVIF;
  return null;
}
