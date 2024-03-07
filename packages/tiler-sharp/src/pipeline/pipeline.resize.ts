import { Tiff } from '@basemaps/shared';
import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved } from './decompressor.js';

/**
 * Pipeline to apply the crop/resizing to datasets
 */
export function cropResizeNearest(
  _source: Tiff,
  data: DecompressedInterleaved,
  comp: CompositionTiff,
): DecompressedInterleaved {
  // Nothing to do
  if (comp.extract == null && comp.resize == null && comp.crop == null) return data;

  // Currently very limited supported input parameters
  if (data.channels !== 1) throw new Error('Unable to crop-resize more than one channel got:' + data.channels);
  if (data.depth !== 'float32') throw new Error('Unable to crop-resize other than float32 got:' + data.depth);

  // Area of the source data that needs to be resampled
  const source = { x: 0, y: 0, width: data.width, height: data.height };
  // Area of the output data
  const target = { width: 0, height: 0, scaleX: 1, scaleY: 1 };

  if (comp.extract) {
    source.width = comp.extract.width;
    source.height = comp.extract.height;

    target.width = comp.extract.width;
    target.height = comp.extract.height;
  }

  if (comp.resize) {
    target.width = comp.resize.width;
    target.height = comp.resize.height;
    target.scaleX = comp.resize.scaleX;
    target.scaleY = comp.resize.scaleY;
  }

  const invScaleX = 1 / target.scaleX;
  const invScaleY = 1 / target.scaleY;
  if (comp.crop) {
    source.x = Math.round(comp.crop.x * invScaleX);
    source.y = Math.round(comp.crop.y * invScaleY);
    source.width = Math.round(comp.crop.width * invScaleX);
    source.height = Math.round(comp.crop.height * invScaleY);

    target.width = comp.crop.width;
    target.height = comp.crop.height;
  }

  // Resample the input tile into the output tile using a nearest neighbor approach
  const outputBuffer = new Float32Array(target.width * target.height);
  for (let y = 0; y < target.height; y++) {
    let sourceY = Math.round(y * invScaleY + source.y);
    if (sourceY > data.height - 1) sourceY = data.height - 1;

    for (let x = 0; x < target.width; x++) {
      let sourceX = Math.round(x * invScaleX + source.x);
      if (sourceX > data.width - 1) sourceX = data.width - 1;

      outputBuffer[y * target.width + x] = data.pixels[sourceY * data.width + sourceX];
    }
  }

  return { pixels: outputBuffer, width: target.width, height: target.height, depth: 'float32', channels: 1 };
}
