import { CogifyCreationOptions } from './cogify/stac.js';

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

const lerc1mm: Preset = {
  name: 'lerc_1mm',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.001,
    maxZErrorOverview: 0.01,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

const lerc10mm: Preset = {
  name: 'lerc_10mm',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.01,
    maxZErrorOverview: 0.02,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

const lzw: Preset = {
  name: 'lzw',
  options: {
    blockSize: 512,
    compression: 'lzw',
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

export const Presets = {
  [webP.name]: webP,
  [lerc1mm.name]: lerc1mm,
  [lerc10mm.name]: lerc10mm,
  [lzw.name]: lzw,
};
