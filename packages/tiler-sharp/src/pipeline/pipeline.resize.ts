import { BoundingBox, Size } from '@basemaps/geo';
import { CompositionTiff, ResizeKernelType } from '@basemaps/tiler';
import { Tiff } from '@cogeotiff/core';

import { DecompressedInterleaved } from './decompressor.js';

/**
 * Pipeline to apply the crop/resizing to datasets
 */
export function cropResize(
  tiff: Tiff,
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  mode: ResizeKernelType | 'bilinear',
): DecompressedInterleaved {
  // Nothing to do
  if (comp.extract == null && comp.resize == null && comp.crop == null) return data;

  // Currently very limited supported input parameters
  if (data.channels !== 1) throw new Error('Unable to crop-resize more than one channel got:' + data.channels);
  if (data.depth !== 'float32') throw new Error('Unable to crop-resize other than float32 got:' + data.depth);

  // Area of the source data that needs to be resampled
  const source = { x: 0, y: 0, width: data.width, height: data.height };
  // Area of the output data
  const target = { width: 0, height: 0, scale: 1 };

  if (comp.extract) {
    source.width = comp.extract.width;
    source.height = comp.extract.height;

    target.width = comp.extract.width;
    target.height = comp.extract.height;
  }

  if (comp.resize) {
    target.width = comp.resize.width;
    target.height = comp.resize.height;
    target.scale = comp.resize.scale;
  }

  const invScale = 1 / target.scale;

  if (comp.crop) {
    source.x = Math.round(comp.crop.x * invScale);
    source.y = Math.round(comp.crop.y * invScale);
    source.width = Math.round(comp.crop.width * invScale);
    source.height = Math.round(comp.crop.height * invScale);

    target.width = comp.crop.width;
    target.height = comp.crop.height;
  }

  const noData = tiff.images[0].noData;

  switch (mode) {
    case 'nearest':
      return resizeNearest(data, comp, source, target);
    case 'bilinear':
      return resizeBilinear(data, comp, source, target, noData);
    default:
      throw new Error('Unable to use resize kernel: ' + mode);
  }
}

function resizeNearest(
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  source: BoundingBox,
  target: Size & { scale: number },
): DecompressedInterleaved {
  const maxWidth = Math.min(comp.source.width, data.width) - 1;
  const maxHeight = Math.min(comp.source.height, data.height) - 1;
  const invScale = 1 / target.scale;

  // Resample the input tile into the output tile using a nearest neighbor approach
  const outputBuffer = new Float32Array(target.width * target.height);
  for (let y = 0; y < target.height; y++) {
    let sourceY = Math.round((y + 0.5) * invScale + source.y);
    if (sourceY > maxHeight) sourceY = maxHeight;

    for (let x = 0; x < target.width; x++) {
      let sourceX = Math.round((x + 0.5) * invScale + source.x);
      if (sourceX > maxWidth) sourceX = maxWidth;

      outputBuffer[y * target.width + x] = data.pixels[sourceY * data.width + sourceX];
    }
  }

  return { pixels: outputBuffer, width: target.width, height: target.height, depth: 'float32', channels: 1 };
}

function resizeBilinear(
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  source: BoundingBox,
  target: Size & { scale: number },
  noData?: number | null,
): DecompressedInterleaved {
  const invScale = 1 / target.scale;

  const maxWidth = Math.min(comp.source.width, data.width) - 2;
  const maxHeight = Math.min(comp.source.height, data.height) - 2;
  const outputBuffer = new Float32Array(target.width * target.height);
  for (let y = 0; y < target.height; y++) {
    const sourceY = Math.min((y + 0.5) * invScale + source.y, maxHeight);
    const minY = Math.floor(sourceY);
    const maxY = minY + 1;

    for (let x = 0; x < target.width; x++) {
      const sourceX = Math.min((x + 0.5) * invScale + source.x, maxWidth);
      const minX = Math.floor(sourceX);
      const maxX = minX + 1;

      const minXMinY = data.pixels[minY * data.width + minX];
      if (minXMinY === noData) continue;
      const maxXMinY = data.pixels[minY * data.width + maxX];
      if (maxXMinY === noData) continue;
      const minXMaxY = data.pixels[maxY * data.width + minX];
      if (minXMaxY === noData) continue;
      const maxXMaxY = data.pixels[maxY * data.width + maxX];
      if (maxXMaxY === noData) continue;

      const xDiff = sourceX - minX;
      const yDiff = sourceY - minY;
      const weightA = (1 - xDiff) * (1 - yDiff);
      const weightB = xDiff * (1 - yDiff);
      const weightC = (1 - xDiff) * yDiff;
      const weightD = xDiff * yDiff;

      const py = minXMinY * weightA + maxXMinY * weightB + minXMaxY * weightC + maxXMaxY * weightD;

      outputBuffer[y * target.width + x] = py;
    }
  }

  return { pixels: outputBuffer, width: target.width, height: target.height, depth: 'float32', channels: 1 };
}
