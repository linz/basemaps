import { Pipeline } from './decompressor.js';
import { PipelineColorRamp } from './pipeline.color.ramp.js';
import { PipelineTerrainRgb } from './pipeline.terrain.rgb.js';

export const Pipelines: Record<string, Pipeline> = {
  [PipelineColorRamp.type]: PipelineColorRamp,
  [PipelineTerrainRgb.type]: PipelineTerrainRgb,
};
