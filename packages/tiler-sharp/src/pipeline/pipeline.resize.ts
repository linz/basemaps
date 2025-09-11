import { BoundingBox, Point, Size } from '@basemaps/geo';
import { CompositionTiff, ResizeKernelType } from '@basemaps/tiler';
import { Tiff } from '@cogeotiff/core';

import { DecompressedInterleaved } from './decompressor.js';

/**
 * Pipeline to apply the crop/resizing to datasets
 */
export function cropResize(
  _tiff: Tiff,
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

  // Currently very limited supported input parameters
  // if (data.channels !== 1) throw new Error('Unable to crop-resize more than one channel got:' + data.channels);

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

  // const noData = tiff.images[0].noData;

  // console.log('resize', mode);
  switch (mode) {
    case 'nearest':
      return resizeNearest(data, comp, source, target);
    case 'bilinear':
      return resizeNearest(data, comp, source, target);
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
    output.pixels.set(data.pixels.subarray(source, source + length), y * crop.width);
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
  // console.log({ maxHeight, maxWidth }, source, data.width, data.height);
  // Resample the input tile into the output tile using a nearest neighbor approach
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;
  const channelOffset = data.width * data.height * 1;
  // const resizeSource = new Set();
  for (let y = 0; y < target.height; y++) {
    let sourceY = Math.round((y + 0.5) * invScale + source.y);
    if (sourceY > maxHeight) sourceY = maxHeight;

    for (let x = 0; x < target.width; x++) {
      let sourceX = Math.round((x + 0.5) * invScale + source.x);
      if (sourceX > maxWidth) sourceX = maxWidth;

      const targetOffset = (y * target.width + x) * ret.channels;
      const sourceOffset = +(sourceY * data.width + sourceX);
      // console.log(x, y, sourceX, sourceY, sourceOffset, targetOffset);

      // if (sourceOffset === 3644) console.log(x, y);
      // if (resizeSource.has(sourceOffset)) throw new Error('Erro' + sourceOffset);
      // resizeSource.add(sourceOffset);
      // console.log(sourceOffset, targetOffset);

      // console.log(x, y, { targetOffset }, data.pixels.length);
      for (let i = 0; i < ret.channels; i++) {
        // console.log(`\t${targetOffset + i} <= ${sourceOffset + i}`);
        outputBuffer[targetOffset + i] = data.pixels[sourceOffset + channelOffset * i];
      }
      // outputBuffer[targetOffset + 3] = 255;
      // if (x > 100) break;
    }
    // if (y > 100) break;
  }

  // console.log({ pix: data.pixels, ret });
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
  const invScale = 1 / target.scale;

  const maxWidth = Math.min(comp.source.width, data.width) - 2;
  const maxHeight = Math.min(comp.source.height, data.height) - 2;
  const ret = getOutputBuffer(data, target);
  const outputBuffer = ret.pixels;
  // console.log({ ret }, target);

  // should numbers be rounded when resampling, with some numbers like uint8 or uint32 numbers
  // will be truncated when being set in their typed buffers,
  //
  // for example: `0.9999` will end up as `0` in a Uint8Array
  // Only floats should be left as floating numbers
  const needsRounding = !data.depth.startsWith('float');

  for (let y = 0; y < target.height; y++) {
    const sourceY = Math.min((y + 0.5) * invScale + source.y, maxHeight);
    const minY = Math.floor(sourceY);
    const maxY = minY + 1;

    for (let x = 0; x < target.width; x++) {
      const sourceX = Math.min((x + 0.5) * invScale + source.x, maxWidth);
      const minX = Math.floor(sourceX);
      const maxX = minX + 1;

      const outPx = y * target.width + x;

      const minXMinY = data.pixels[minY * data.width + minX];
      if (minXMinY === noData) {
        outputBuffer[outPx] = noData;
        continue;
      }
      const maxXMinY = data.pixels[minY * data.width + maxX];
      if (maxXMinY === noData) {
        outputBuffer[outPx] = noData;
        continue;
      }
      const minXMaxY = data.pixels[maxY * data.width + minX];
      if (minXMaxY === noData) {
        outputBuffer[outPx] = noData;
        continue;
      }
      const maxXMaxY = data.pixels[maxY * data.width + maxX];
      if (maxXMaxY === noData) {
        outputBuffer[outPx] = noData;
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

  return ret;
}
