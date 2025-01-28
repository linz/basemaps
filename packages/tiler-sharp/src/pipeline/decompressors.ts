import { Compression } from '@cogeotiff/core';

import { Decompressor } from './decompressor.js';
import { LercDecompressor } from './decompressor.lerc.js';
import { LzwDecompressor } from './decompressor.lzw.js';

export const Decompressors: Record<string, Decompressor> = {
  [Compression.Lerc]: LercDecompressor,
  [Compression.Lzw]: LzwDecompressor,
};
