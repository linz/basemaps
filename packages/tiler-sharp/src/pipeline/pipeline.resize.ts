import { BoundingBox, Point, Size } from '@basemaps/geo';
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
  if (comp.extract == null && comp.resize == null) {
    const cropVal = comp.crop;
    // Nothing to do
    if (cropVal == null) return data;

    // since there is no resize we can just copy input buffers into output buffers
    return applyCrop(data, cropVal);
  }

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

  const invScaleX = 1 / (comp.resize?.scaleX ?? target.scale);
  const invScaleY = 1 / (comp.resize?.scaleY ?? target.scale);

  if (comp.crop) {
    source.x = comp.crop.x * invScaleX;
    source.y = comp.crop.y * invScaleY;
    source.width = comp.crop.width * invScaleX;
    source.height = comp.crop.height * invScaleY;

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

export function applyCrop(data: DecompressedInterleaved, crop: Size & Point): DecompressedInterleaved {
  // Cropping a image is just copying sub parts of a source image into a output image
  // loop line by line slicing the new image
  const output = getOutputBuffer(data, { width: crop.width, height: crop.height });
  for (let y = 0; y < crop.height; y++) {
    const source = ((y + crop.y) * data.width + crop.x) * data.channels;
    const length = crop.width * data.channels;
    output.pixels.set(data.pixels.subarray(source, source + length), y * crop.width * data.channels);
  }

  return output;
}

function resizeNearest(
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  source: BoundingBox,
  target: Size & { scale: number },
): DecompressedInterleaved {
  const maxWidth = Math.min(comp.source.width, data.width) - 1;
  const maxHeight = Math.min(comp.source.height, data.height) - 1;
  const invScaleX = 1 / (comp.resize?.scaleX ?? target.scale);
  const invScaleY = 1 / (comp.resize?.scaleY ?? target.scale);
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;

  // FIXME! LERC is band interleaved rather than pixel interleaved
  // const channelOffset = data.width * data.height * 1;
  // const resizeSource = new Set();
  for (let y = 0; y < target.height; y++) {
    let sourceY = Math.floor((y + 0.5) * invScaleY + source.y);
    if (sourceY > maxHeight) sourceY = maxHeight;

    for (let x = 0; x < target.width; x++) {
      let sourceX = Math.floor((x + 0.5) * invScaleX + source.x);
      if (sourceX > maxWidth) sourceX = maxWidth;

      const targetOffset = (y * target.width + x) * ret.channels;
      const sourceOffset = (sourceY * data.width + sourceX) * ret.channels;

      for (let i = 0; i < ret.channels; i++) {
        outputBuffer[targetOffset + i] = data.pixels[sourceOffset + i];
      }
    }
  }

  return ret;
}

function getOutputBuffer(source: DecompressedInterleaved, target: Size): DecompressedInterleaved {
  switch (source.depth) {
    case 'uint8':
      return {
        pixels: new Uint8Array(target.width * target.height * source.channels),
        width: target.width,
        height: target.height,
        depth: source.depth,
        channels: source.channels,
      };
    case 'float32':
      return {
        pixels: new Float32Array(target.width * target.height * source.channels),
        width: target.width,
        height: target.height,
        depth: source.depth,
        channels: source.channels,
      };
    case 'uint32':
      return {
        pixels: new Uint32Array(target.width * target.height * source.channels),
        width: target.width,
        height: target.height,
        depth: source.depth,
        channels: source.channels,
      };
    case 'uint16':
      return {
        pixels: new Uint16Array(target.width * target.height * source.channels),
        width: target.width,
        height: target.height,
        depth: source.depth,
        channels: source.channels,
      };
  }
}

export function resizeBilinear(
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  source: BoundingBox,
  target: Size & { scale: number },
  noData?: number | null,
): DecompressedInterleaved {
  const invScaleX = 1 / (comp.resize?.scaleX ?? target.scale);
  const invScaleY = 1 / (comp.resize?.scaleY ?? target.scale);
  if (invScaleX > 2 || invScaleY > 2) {
    return resizeArea(data, comp, source, target, noData);
  }

  const maxWidth = Math.min(comp.source.width, data.width) - 2;
  const maxHeight = Math.min(comp.source.height, data.height) - 2;
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;

  // should numbers be rounded when resampling, with some numbers like uint8 or uint32 numbers
  // will be truncated when being set in their typed buffers,
  //
  // for example: `0.9999` will end up as `0` in a Uint8Array
  // Only floats should be left as floating numbers
  const needsRounding = !data.depth.startsWith('float');

  for (let y = 0; y < target.height; y++) {
    const sourceY = Math.min((y + 0.5) * invScaleY + source.y, maxHeight);
    const minY = Math.floor(sourceY);
    const maxY = minY + 1;

    for (let x = 0; x < target.width; x++) {
      const sourceX = Math.min((x + 0.5) * invScaleX + source.x, maxWidth);
      const minX = Math.floor(sourceX);
      const maxX = minX + 1;

      for (let i = 0; i < ret.channels; i++) {
        const outPx = (y * target.width + x) * data.channels + i;

        // Bilinear interpolation for upscaling
        const minXMinY = data.pixels[(minY * data.width + minX) * data.channels + i];
        const maxXMinY = data.pixels[(minY * data.width + maxX) * data.channels + i];
        const minXMaxY = data.pixels[(maxY * data.width + minX) * data.channels + i];
        const maxXMaxY = data.pixels[(maxY * data.width + maxX) * data.channels + i];

        if (minXMinY === noData || maxXMinY === noData || minXMaxY === noData || maxXMaxY === noData) {
          outputBuffer[outPx] = noData ?? 0;
          continue;
        }

        const xDiff = sourceX - minX;
        const yDiff = sourceY - minY;
        const weightA = (1 - xDiff) * (1 - yDiff);
        const weightB = xDiff * (1 - yDiff);
        const weightC = (1 - xDiff) * yDiff;
        const weightD = xDiff * yDiff;

        const pixel = minXMinY * weightA + maxXMinY * weightB + minXMaxY * weightC + maxXMaxY * weightD;
        outputBuffer[outPx] = needsRounding ? Math.round(pixel) : pixel;
      }
    }
  }

  return ret;
}

export function resizeArea(
  data: DecompressedInterleaved,
  comp: CompositionTiff,
  source: BoundingBox,
  target: Size & { scale: number },
  noData?: number | null,
): DecompressedInterleaved {
  const invScaleX = 1 / (comp.resize?.scaleX ?? target.scale);
  const invScaleY = 1 / (comp.resize?.scaleY ?? target.scale);
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;
  const needsRounding = !data.depth.startsWith('float');

  const fullArea = invScaleX * invScaleY;

  for (let y = 0; y < target.height; y++) {
    const startY = y * invScaleY + source.y;
    const endY = (y + 1) * invScaleY + source.y;

    for (let x = 0; x < target.width; x++) {
      const startX = x * invScaleX + source.x;
      const endX = (x + 1) * invScaleX + source.x;

      for (let i = 0; i < ret.channels; i++) {
        const outPx = (y * target.width + x) * data.channels + i;

        let totalValue = 0;
        let totalWeight = 0;

        const minSY = Math.max(0, Math.floor(startY));
        const maxSY = Math.min(data.height - 1, Math.ceil(endY) - 1);
        const minSX = Math.max(0, Math.floor(startX));
        const maxSX = Math.min(data.width - 1, Math.ceil(endX) - 1);

        for (let sy = minSY; sy <= maxSY; sy++) {
          const yWeight = Math.min(sy + 1, endY) - Math.max(sy, startY);
          for (let sx = minSX; sx <= maxSX; sx++) {
            const xWeight = Math.min(sx + 1, endX) - Math.max(sx, startX);
            const weight = xWeight * yWeight;

            const val = data.pixels[(sy * data.width + sx) * data.channels + i];
            if (val !== noData) {
              totalValue += val * weight;
              totalWeight += weight;
            }
          }
        }

        if (totalWeight === 0) {
          outputBuffer[outPx] = noData ?? 0;
          continue;
        }

        // Determine if we are at an image edge (not just a tile edge)
        // If we are at an image edge, we want to fade to transparent (normalize by fullArea)
        // If we are at a tile edge but still within the image, we want to extrapolate (normalize by totalWeight)
        // const isAtImageX = comp.source.x + startX < 0 || comp.source.x + endX > comp.source.width;
        // const isAtImageY = comp.source.y + startY < 0 || comp.source.y + endY > comp.source.height;

        const pixel = totalValue / fullArea; // (isAtImageX || isAtImageY ? fullArea : totalWeight);
        outputBuffer[outPx] = needsRounding ? Math.round(pixel) : pixel;
      }
    }
  }

  return ret;
}
