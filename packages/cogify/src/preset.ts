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
const lerc100mm: Preset = {
  name: 'lerc_100mm',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.1,
    maxZErrorOverview: 1,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

const lerc10m: Preset = {
  name: 'lerc_10m',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 10,
    maxZErrorOverview: 100,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

const lerc1m: Preset = {
  name: 'lerc_1m',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 1,
    maxZErrorOverview: 10,
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
    maxZErrorOverview: 0.1,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

const lerc1mm: Preset = {
  name: 'lerc_1mm',
  options: {
    blockSize: 512,
    compression: 'lerc',
    maxZError: 0.001,
    maxZErrorOverview: 0.1,
    warpResampling: 'bilinear',
    overviewResampling: 'bilinear',
  },
};

export const Presets = {
  [webP.name]: webP,
  [lerc10mm.name]: lerc10mm,
  [lerc1mm.name]: lerc1mm,
  [lerc100mm.name]: lerc100mm,
  [lerc1m.name]: lerc1m,
  [lerc10m.name]: lerc10m,
};
