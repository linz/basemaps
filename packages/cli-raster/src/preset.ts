import { CogifyCreationOptions } from './cogify/stac.js';

export const CogifyDefaults = {
  compression: 'webp',
  blockSize: 512,
  quality: 90,
  warpResampling: 'bilinear',
  overviewResampling: 'lanczos',
} as const;

const webP = {
  name: 'webp' as const,
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: CogifyDefaults.compression,
    quality: CogifyDefaults.quality,
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  } satisfies Partial<CogifyCreationOptions>,
};

const webP80 = {
  name: 'webp_80' as const,
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: CogifyDefaults.compression,
    quality: 80,
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  } satisfies Partial<CogifyCreationOptions>,
};

const lerc1mm = {
  name: 'lerc_1mm' as const,
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.001,
    maxZErrorOverview: 0.01,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  } satisfies Partial<CogifyCreationOptions>,
};

const lerc10mm = {
  name: 'lerc_10mm' as const,
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.01,
    maxZErrorOverview: 0.02,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  } satisfies Partial<CogifyCreationOptions>,
};

const lzw = {
  name: 'lzw' as const,
  options: {
    blockSize: 512,
    compression: 'lzw',
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  } satisfies Partial<CogifyCreationOptions>,
};

const zstd_17 = {
  name: 'zstd_17' as const,
  options: {
    blockSize: 512,
    compression: 'zstd',
    predictor: 2,
    level: 17,
    warpResampling: 'bilinear',
    overviewResampling: 'lanczos',
  } satisfies Partial<CogifyCreationOptions>,
};

export const Presets = {
  [webP.name]: webP,
  [webP80.name]: webP80,
  [lerc1mm.name]: lerc1mm,
  [lerc10mm.name]: lerc10mm,
  [lzw.name]: lzw,
  [zstd_17.name]: zstd_17,
} as const;

export type GdalBandPreset = 'red' | 'green' | 'blue' | 'alpha' | 'nir' | 'undefined' | 'gray';
export const BandPresets: Record<string, GdalBandPreset[]> = {
  /**
   * 4 band image, generally [uint8,uint8,uint8,uint8]
   * - Red,Green,Blue,Alpha
   */
  rgba: ['red', 'green', 'blue', 'alpha'],
  /**
   * 4 Band image, generally [uint16,uint16,uint16,uint16]
   * - Red,Green,Blue,Near Infrared
   */
  rgbi: ['red', 'green', 'blue', 'nir', 'alpha'],
  /**
   * One band image, generally [float32]
   */
  elevation: ['undefined'],

  /** One band image, generally 0-255 greyscale */
  hillshade: ['gray'],
};

export type PresetName = keyof typeof Presets;
export type BandPresetName = keyof typeof BandPresets;

export const AllowedPresets: Record<PresetName, BandPresetName[]> = {
  // Webp is only suitable for RGB(A) images
  [webP.name]: ['rgba'],
  [webP80.name]: ['rgba'],
  [lerc1mm.name]: ['elevation', 'rgba', 'rgbi'],
  [lerc10mm.name]: ['elevation', 'rgba', 'rgbi'],
  [lzw.name]: ['elevation', 'rgba', 'rgbi'],
  [zstd_17.name]: ['elevation', 'rgba', 'rgbi'],
};
