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
export interface DecompressedInterleavedUint16 {
  pixels: Uint16Array | Uint8ClampedArray;
  depth: 'uint16';
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
  | DecompressedInterleavedUint16
  | DecompressedInterleavedUint32;

export type TiffTileId = { imageId: number; x: number; y: number };
export interface Decompressor {
  type: 'image/webp' | 'application/lerc' | 'application/zstd';
  bytes(source: Tiff, tile: TiffTileId, bytes: ArrayBuffer): Promise<DecompressedInterleaved>;
}

export interface Pipeline<T = undefined> {
  type: string;
  process(
    source: CompositionTiff,
    bytes: DecompressedInterleaved,
    ctx?: T,
  ): Promise<DecompressedInterleaved> | DecompressedInterleaved;
}
