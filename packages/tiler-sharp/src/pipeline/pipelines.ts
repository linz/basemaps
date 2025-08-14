import { Pipeline } from './decompressor.js';
import { PipelineColorRamp } from './pipeline.color.ramp.js';
import { PipelineExtract } from './pipeline.extract.js';
import { PipelineNdvi } from './pipeline.nvdi.js';
import { PipelineTerrainRgb } from './pipeline.terrain.rgb.js';

export const Pipelines: Record<string, Pipeline<unknown>> = {
  [PipelineColorRamp.type]: PipelineColorRamp,
  [PipelineTerrainRgb.type]: PipelineTerrainRgb,
  [PipelineExtract.type]: PipelineExtract,
  [PipelineNdvi.type]: PipelineNdvi,
};
