import { Compression, Photometric, TiffEndian, TiffImage, TiffTag, TiffVersion } from '@cogeotiff/core';
import sharp from 'sharp';

import { DecompressedInterleavedDepth } from '../decompressor.js';

/**
 * Tiff header data types see {@link TiffTagValueType} from '@cogeotiff/core'
 */
const TiffTagType = {
  Uint8: 1,
  //   Uint16: 3,
  Uint32: 4,
};

export async function decodeLzwTiff(
  image: TiffImage,
  depth: DecompressedInterleavedDepth,
  channels: number,
  tileBuffer: ArrayBuffer,
): Promise<{ tiff: Buffer; decoded: ArrayBuffer }> {
  const headerSize = 16 * 1024;
  const buffer = Buffer.alloc(headerSize + tileBuffer.byteLength);

  buffer.writeUint16LE(TiffEndian.Little, 0); // LittleEndian
  buffer.writeUint16LE(TiffVersion.Tiff, 2); // Version - Little Tiff
  buffer.writeUint32LE(8, 4); // Byte offset to where the first set of IFD tags start

  const [bitsPerSample, sampleFormat] = await Promise.all([
    image.fetch(TiffTag.BitsPerSample),
    image.fetch(TiffTag.SampleFormat),
  ]);

  const { width, height } = image.tileSize;

  const tags = [
    { tag: TiffTag.Compression, value: [Compression.Lzw], type: TiffTagType.Uint32 },
    { tag: TiffTag.TileWidth, value: [width], type: TiffTagType.Uint32 },
    { tag: TiffTag.TileHeight, value: [height], type: TiffTagType.Uint32 },
    { tag: TiffTag.ImageWidth, value: [width], type: TiffTagType.Uint32 },
    { tag: TiffTag.ImageHeight, value: [height], type: TiffTagType.Uint32 },
    { tag: TiffTag.Photometric, value: [Photometric.MinIsBlack], type: TiffTagType.Uint32 },
    { tag: TiffTag.TileByteCounts, value: [tileBuffer.byteLength], type: TiffTagType.Uint32 },
    { tag: TiffTag.TileOffsets, value: [headerSize], type: TiffTagType.Uint32 },
    { tag: TiffTag.BitsPerSample, value: bitsPerSample as number[], type: TiffTagType.Uint8 },
    { tag: TiffTag.SampleFormat, value: sampleFormat as number[], type: TiffTagType.Uint8 },
  ];

  /**
   * Write tags
   *
   * for a regular tiff, Each tag entry is specified as:
   *
   * UInt16:TagCode
   * UInt16:TagType
   * UInt32:TagCount
   * UInt32:Pointer To Value or the actual value provided its less than 4 bytes
   */
  let offset = 8;
  buffer.writeUint16LE(tags.length, offset);
  offset += 2;

  const tagSize = 2 + 2 + 4 + 4;
  for (const tag of tags) {
    const tagStart = offset;
    buffer.writeUInt16LE(tag.tag, offset);
    offset += 2;
    buffer.writeUInt16LE(tag.type, offset);
    offset += 2;
    buffer.writeUint32LE(tag.value.length, offset);
    offset += 4;

    for (const v of tag.value) {
      switch (tag.type) {
        case TiffTagType.Uint8:
          buffer.writeUint8(v, offset);
          offset += 1;
          break;
        case TiffTagType.Uint32:
          buffer.writeUint32LE(v, offset);
          offset += 4;
          break;
        default:
          throw 'Unknown type';
      }
    }
    const targetOffset = tagStart + tagSize;

    // TODO larger values should be written into another place in the buffer
    // because this tiff is soo simple this should never happen unless we start getting
    // more complex data types
    if (targetOffset < offset) throw new Error('TIFF offset overflow');
    offset = targetOffset;
  }

  // Add the tile onto the end of the buffer/
  Buffer.from(tileBuffer).copy(buffer, headerSize);

  const buf = sharp(buffer);
  if (channels === 1) buf.toColourspace('b-w');
  switch (depth) {
    case 'float32':
      buf.raw({ depth: 'float' });
      break;
    case 'uint8':
      buf.raw({ depth: 'uchar' });
      break;
    case 'uint16':
    case 'uint32':
      throw new Error('Unsupported depth');
  }

  const sharpOutput = await buf.toBuffer({ resolveWithObject: true });
  const outBuffer = sharpOutput.data;
  const arrayBuffer = outBuffer.buffer.slice(outBuffer.byteOffset, outBuffer.byteOffset + outBuffer.byteLength);

  return { tiff: buffer, decoded: arrayBuffer };
}
