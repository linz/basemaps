import { CogifyCreationOptions } from './cogify/stac';

export const CogifyDefaults = {
  compression: 'webp',
  blockSize: 512,
  quality: 90,
  warpResampling: 'bilinear',
  overviewResampling: 'lanczos',
} as const;

export interface Preset {
  name: string;
  options: Partial<CogifyCreationOptions>;
}

const webP: Preset = {
  name: 'webp',
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: CogifyDefaults.compression,
    quality: CogifyDefaults.quality,
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  },
};

const lerc10mm: Preset = {
  name: 'lerc_10mm',
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: 'lerc',
    maxZError: 0.01,
    // TODO should a different resampling be used for LERC?
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  },
};

const lerc1mm: Preset = {
  name: 'lerc_1mm',
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: 'lerc',
    maxZError: 0.001,
    // TODO should a different resampling be used for LERC?
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  },
};

export const Presets = { [webP.name]: webP, [lerc10mm.name]: lerc10mm, [lerc1mm.name]: lerc1mm };
