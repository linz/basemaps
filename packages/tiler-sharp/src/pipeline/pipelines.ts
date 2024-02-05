import { Pipeline } from './decompressor.js';
import { PipelineColorRamp } from './pipeline.color.ramp.js';

export const Pipelines: Record<string, Pipeline> = {
  [PipelineColorRamp.type]: PipelineColorRamp,
};
