import { ImageFormat, Point, Size } from '@basemaps/geo';
import { Tiff } from '@cogeotiff/core';
import { Cotar } from '@cotar/core';
import { Metrics } from '@linzjs/metrics';

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
  metrics?: Metrics;
}
export type Composition = CompositionTiff | CompositionCotar;

export interface CompositionTiff {
  type: 'tiff';
  /** Tiff */
  asset: Tiff;
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
    /** Scale width  < 1 to zoom in, > 1 to zoom out, should generally be the same as scaleY */
    scaleX: number;
    /** Scale height  < 1 to zoom in, > 1 to zoom out */
    scaleY: number;
  };
  /** Crop after the resize */
  crop?: Size & Point;
}

export interface CompositionCotar {
  type: 'cotar';
  asset: Cotar;
  /** Location in the archive for the tile */
  path: string;
}

export const ImageFormatOrder: ImageFormat[] = ['jpeg', 'webp', 'png'];

/** Guess the image format based on the file extension */
export function getImageFormat(ext?: string): ImageFormat | null {
  if (ext == null) return null;
  const search = ext.toLowerCase();
  if (search === 'png') return 'png';
  if (search === 'webp') return 'webp';
  if (search === 'jpeg' || search === 'jpg') return 'jpeg';
  if (search === 'avif') return 'avif';
  return null;
}
