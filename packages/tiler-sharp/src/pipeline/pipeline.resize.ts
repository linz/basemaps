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
  const invScale = 1 / target.scale;
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;

  // FIXME! LERC is band interleaved rather than pixel interleaved
  // const channelOffset = data.width * data.height * 1;
  // const resizeSource = new Set();
  for (let y = 0; y < target.height; y++) {
    let sourceY = Math.round((y + 0.5) * invScale + source.y);
    if (sourceY > maxHeight) sourceY = maxHeight;

    for (let x = 0; x < target.width; x++) {
      let sourceX = Math.round((x + 0.5) * invScale + source.x);
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
  const maxWidth = Math.min(comp.source.width, data.width);
  const maxHeight = Math.min(comp.source.height, data.height);

  const scaleX = maxWidth / target.width;
  const scaleY = maxHeight / target.height;

  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;

  // should numbers be rounded when resampling, with some numbers like uint8 or uint32 numbers
  // will be truncated when being set in their typed buffers,
  //
  // for example: `0.9999` will end up as `0` in a Uint8Array
  // Only floats should be left as floating numbers
  const needsRounding = !data.depth.startsWith('float');

  for (let y = 0; y < target.height; y++) {
    const yS = (y + 0.5) * scaleY - 0.5 + source.y;

    const yMin = Math.max(0, Math.floor(yS));
    const yMax = Math.min(Math.ceil(yS), data.height - 1);
    const yFraction = yS - yMin;

    for (let x = 0; x < target.width; x++) {
      const xS = (x + 0.5) * scaleX - 0.5 + source.x;

      const xMin = Math.max(0, Math.floor(xS));
      const xMax = Math.min(Math.ceil(xS), data.width - 1);

      // If the pixel maps exactly to a single pixel, no interpolation is needed
      if (xMin === xMax && yMin === yMax) {
        for (let i = 0; i < ret.channels; i++) {
          const outPx = (y * target.width + x) * data.channels + i;
          outputBuffer[outPx] = data.pixels[(yMin * data.width + xMin) * data.channels + i];
        }
        continue;
      }
      const xFraction = xS - xMin;

      const ul = (yMin * data.width + xMin) * data.channels; // upper-left
      const ur = (yMin * data.width + xMax) * data.channels; // upper-right
      const ll = (yMax * data.width + xMin) * data.channels; // lower-left
      const lr = (yMax * data.width + xMax) * data.channels; // lower-right

      for (let i = 0; i < ret.channels; i++) {
        const outPx = (y * target.width + x) * data.channels + i;

        const ulPx = data.pixels[ul + i];
        if (ulPx === noData) {
          outputBuffer[outPx] = noData;
          continue;
        }
        const urPx = data.pixels[ur + i];
        if (urPx === noData) {
          outputBuffer[outPx] = noData;
          continue;
        }
        const llPx = data.pixels[ll + i];
        if (llPx === noData) {
          outputBuffer[outPx] = noData;
          continue;
        }
        const lrPx = data.pixels[lr + i];
        if (lrPx === noData) {
          outputBuffer[outPx] = noData;
          continue;
        }

        const top = ulPx + (urPx - ulPx) * xFraction;
        const bottom = llPx + (lrPx - llPx) * xFraction;
        const value = top + (bottom - top) * yFraction;
        outputBuffer[outPx] = needsRounding ? Math.round(value) : value;
      }
    }
  }

  return ret;
}
