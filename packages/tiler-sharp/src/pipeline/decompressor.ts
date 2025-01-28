import { CompositionTiff } from '@basemaps/tiler';
import { SampleFormat, Tiff } from '@cogeotiff/core';

interface DecompressedInterleavedBase {
  channels: number;
  width: number;
  height: number;
}

export interface DecompressedInterleavedUint32 extends DecompressedInterleavedBase {
  buffer: Uint32Array;
  depth: 'uint32';
}

export interface DecompressedInterleavedUint16 extends DecompressedInterleavedBase {
  buffer: Uint16Array;
  depth: 'uint16';
}

export interface DecompressedInterleavedFloat extends DecompressedInterleavedBase {
  buffer: Float32Array;
  depth: 'float32';
}

export interface DecompressedInterleavedUint8 extends DecompressedInterleavedBase {
  buffer: Uint8Array | Uint8ClampedArray;
  depth: 'uint8';
}

// One buffer containing all bands
export type DecompressedInterleaved =
  | DecompressedInterleavedFloat
  | DecompressedInterleavedUint8
  | DecompressedInterleavedUint16
  | DecompressedInterleavedUint32;

export type DecompressedInterleavedDepth = DecompressedInterleaved['depth'];
export type DecompressedInterleavedBuffer = DecompressedInterleaved['buffer'];

export interface DecompressionContext {
  /** Source tiff file  */
  tiff: Tiff;
  x: number;
  y: number;
  imageId: number;
  /** Raw bytes needing to be decompressed */
  bytes: ArrayBuffer;
}

export interface Decompressor {
  type: 'image/webp' | 'application/lerc' | 'application/lzw';
  decompress(ctx: DecompressionContext): Promise<DecompressedInterleaved>;
}

export interface Pipeline {
  type: string;
  process(
    source: CompositionTiff,
    bytes: DecompressedInterleaved,
  ): Promise<DecompressedInterleaved> | DecompressedInterleaved;
}

/**
 * Create a buffer of a given size and type
 *
 * @param depth data type of the buffer
 * @param width number of pixels wide
 * @param height number of pixels heigh
 * @param channels number of channels
 *
 * @returns typed array buffer of size
 */
export function createBuffer(
  depth: DecompressedInterleaved['depth'],
  width: number,
  height: number,
  channels: number,
): DecompressedInterleavedBuffer {
  switch (depth) {
    case 'float32':
      return new Float32Array(width * height * channels);
    case 'uint8':
      return new Uint8Array(width * height * channels);
    case 'uint16':
      return new Uint16Array(width * height * channels);
    case 'uint32':
      return new Uint32Array(width * height * channels);
  }
}

/**
 * Create the correct typed buffer from the depth parameter
 * @param buffer source array buffer
 * @param depth type of typed array to create
 * @returns
 */
export function toTypedBuffer(
  buffer: Uint8Array | ArrayBuffer,
  depth: DecompressedInterleavedDepth,
): DecompressedInterleavedBuffer {
  if (buffer instanceof Uint8Array) buffer = buffer.buffer;
  switch (depth) {
    case 'float32':
      return new Float32Array(buffer);
    case 'uint8':
      return new Uint8ClampedArray(buffer);
    case 'uint16':
      return new Uint16Array(buffer);
    case 'uint32':
      return new Uint32Array(buffer);
  }
}

/**
 * Convert tiff tags to the depth parameter
 * @param bitsPerSample
 * @param sampleFormat
 * @returns
 */
export function tiffToDepth(
  bitsPerSample: number[],
  sampleFormat: SampleFormat = SampleFormat.Uint,
): DecompressedInterleavedDepth {
  // TODO can we assume that all samples are the same length
  const firstBits = bitsPerSample[0];

  // only allow uint8/16/32, by default no sample format is uint
  if (sampleFormat == null || sampleFormat === SampleFormat.Uint) {
    if (firstBits === 8 || firstBits === 16 || firstBits === 32) {
      return `uint${bitsPerSample[0]}` as DecompressedInterleavedDepth;
    }
  }

  if (sampleFormat === SampleFormat.Float && firstBits === 32) {
    return `float${bitsPerSample[0]}` as DecompressedInterleavedDepth;
  }

  throw new Error('Unable to parse Tiff sampleFormat and bits per sample');
}
