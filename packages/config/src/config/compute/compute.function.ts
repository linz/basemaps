export type ConfigComputeFunction = ConfigComputeFunctionTerrainRgb | ConfigComputeFunctionColorRamp;

export interface ConfigComputeFunctionTerrainRgb {
  function: 'terrain-rgb';
}

export type ConfigComputeOutputFormat = ConfigComputeOutputFormatPng | ConfigComputeOutputFormatWebp;

export interface ConfigComputeOutputFormatPng {
  type: 'png';
  background?: { r: 0; g: 0; b: 0; alpha: 0 };
}

export interface ConfigComputeOutputFormatWebp {
  type: 'webp';
  lossless?: boolean;
  level?: number;
  background?: { r: 0; g: 0; b: 0; alpha: 0 };
}

export interface ConfigComputeFunctionColorRamp {
  function: 'color-ramp';
  ramp: string[];
}
