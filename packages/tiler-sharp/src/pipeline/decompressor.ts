import { ConfigRasterPipeline } from '@basemaps/config/build/config/tile.set.js';
import { Tiff } from '@basemaps/shared';

export interface DecompressedInterleavedFloat {
  pixels: Float32Array;
  depth: 'float32';
  channels: number;
  width: number;
  height: number;
}

export interface DecompressedInterleavedUint8 {
  pixels: Uint8Array | Uint8ClampedArray;
  depth: 'uint8';
  channels: number;
  width: number;
  height: number;
}

// One buffer containing all bands
export type DecompressedInterleaved = DecompressedInterleavedFloat | DecompressedInterleavedUint8;

export interface Decompressor {
  type: 'image/webp' | 'application/lerc';
  bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved>;
}

export interface Pipeline {
  type: string;
  process(
    source: Tiff,
    bytes: DecompressedInterleaved,
    pipeline: ConfigRasterPipeline,
  ): Promise<DecompressedInterleaved> | DecompressedInterleaved;
}
