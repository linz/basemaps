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

const lerc1cm: Preset = {
  name: 'lerc_0.01',
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
  name: 'lerc_0.01',
  options: {
    blockSize: CogifyDefaults.blockSize,
    compression: 'lerc',
    maxZError: 0.001,
    // TODO should a different resampling be used for LERC?
    warpResampling: CogifyDefaults.warpResampling,
    overviewResampling: CogifyDefaults.overviewResampling,
  },
};

export const Presets = { [webP.name]: webP, [lerc1cm.name]: lerc1cm, [lerc1mm.name]: lerc1mm };
