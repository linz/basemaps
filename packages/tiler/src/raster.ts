import { Bounds, ImageFormat, Size } from '@basemaps/geo';
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
  metrics?: Metrics;
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

export const ImageFormatOrder = [ImageFormat.Jpeg, ImageFormat.Webp, ImageFormat.Png];

/** Guess the image format based on the file extension */
export function getImageFormat(ext?: string): ImageFormat | null {
  if (ext == null) return null;
  const search = ext.toLowerCase();
  if (search === ImageFormat.Png) return ImageFormat.Png;
  if (search === ImageFormat.Webp) return ImageFormat.Webp;
  if (search === ImageFormat.Jpeg || search === 'jpg') return ImageFormat.Jpeg;
  if (search === ImageFormat.Avif) return ImageFormat.Avif;
  return null;
}
