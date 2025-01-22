import { CompositionTiff } from '@basemaps/tiler';
import { Tiff } from '@cogeotiff/core';

export interface DecompressedInterleavedUint32 {
  pixels: Uint32Array;
  depth: 'uint32';
  channels: number;
  width: number;
  height: number;
}

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
export type DecompressedInterleaved =
  | DecompressedInterleavedFloat
  | DecompressedInterleavedUint8
  | DecompressedInterleavedUint32;

export interface Decompressor {
  type: 'image/webp' | 'application/lerc';
  bytes(source: Tiff, tile: ArrayBuffer): Promise<DecompressedInterleaved>;
}

export interface Pipeline {
  type: string;
  process(
    source: CompositionTiff,
    bytes: DecompressedInterleaved,
  ): Promise<DecompressedInterleaved> | DecompressedInterleaved;
}
