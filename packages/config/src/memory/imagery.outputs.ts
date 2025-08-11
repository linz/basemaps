import { ConfigImagery, ImageryBandType } from '../config/imagery.js';
import { ConfigTileSetRaster, ConfigTileSetRasterOutput } from '../config/tile.set.js';
import { DefaultBandExpandOutput, DefaultColorRampOutput, DefaultTerrainRgbOutput } from '../config/tile.set.output.js';
import { PipelineExtractArgs, PipelineNdviArgs } from '../config/tile.set.pipeline.js';

export function addDefaultOutputPipelines(
  ts: ConfigTileSetRaster,
  img: ConfigImagery,
): ConfigTileSetRasterOutput[] | undefined {
  // Outputs already exist
  if (ts.outputs != null) return ts.outputs;

  // Unable to determine band information
  if (img.bands == null || img.bands.length === 0) return undefined;

  // const colors = img.bands.map((m) => m.color).join(',');

  if (img.bands.length === 1) {
    if (img.bands[0].color === 'gray') return [DefaultBandExpandOutput];

    // Likely elevation dataset as it is one band with no color interpretation
    return [DefaultTerrainRgbOutput, DefaultColorRampOutput];
  }
  const colors = { red: -1, green: -1, blue: -1, nir: -1, alpha: -1 } satisfies Record<string, number>;
  for (let i = 0; i < img.bands.length; i++) {
    const band = img.bands[i];
    if (band.color) (colors as Record<string, number>)[band.color] = i;
  }

  // Standard RGB image
  if (img.bands.length === 3 && colors.red >= 0 && colors.green >= 0 && colors.blue >= 0) return;
  // Standard RGBA image
  if (img.bands.length === 4 && colors.red >= 0 && colors.green >= 0 && colors.blue >= 0 && colors.alpha >= 0) return;

  const pipelines: ConfigTileSetRasterOutput[] = [];

  if (colors.red >= 0 && colors.green >= 0 && colors.blue >= 0) {
    const rgbExtract: PipelineExtractArgs = {
      type: 'extract',
      r: colors.red,
      g: colors.green,
      b: colors.blue,
      alpha: colors.alpha,
    };
    const pipeline = { name: 'rgb', title: 'RGBA', pipeline: [rgbExtract] };
    rgbExtract.scale = getBandScales(img.bands, rgbExtract);
    pipelines.push(pipeline);
  }

  if (colors.nir >= 0 && colors.red >= 0) {
    const ndviArgs: PipelineNdviArgs = { type: 'ndvi', r: colors.red, nir: colors.nir, alpha: colors.alpha };

    const scale = {
      r: getScale(img.bands[colors.red], 'red'),
      nir: getScale(img.bands[colors.nir], 'nir'),
      alpha: getAlphaScale(img.bands[colors.alpha]),
    };
    console.log(scale);
    if (scale.r && scale.nir && scale.alpha) ndviArgs.scale = scale as PipelineNdviArgs['scale'];
    // console.log(ndviArgs)
    pipelines.push({
      name: 'ndvi',
      title: 'NDVI',
      pipeline: [ndviArgs],
    });
  }

  if (colors.red >= 0 && colors.green >= 0 && colors.nir >= 0) {
    const falseColorExtract: PipelineExtractArgs = {
      type: 'extract',
      r: colors.nir,
      g: colors.red,
      b: colors.green,
      alpha: colors.alpha,
    };
    const pipeline = { name: 'false-color', title: 'FalseColor', pipeline: [falseColorExtract] };
    falseColorExtract.scale = getBandScales(img.bands, falseColorExtract);
    pipelines.push(pipeline);
  }

  if (pipelines.length > 0) return pipelines;
  return undefined;
}

function getBandScales(bands: ImageryBandType[], pipe: PipelineExtractArgs): PipelineExtractArgs['scale'] | undefined {
  const scale = {
    r: getScale(bands[pipe.r], 'red'),
    g: getScale(bands[pipe.g], 'green'),
    b: getScale(bands[pipe.b], 'blue'),
    alpha: getAlphaScale(bands[pipe.alpha]),
  };
  if (scale.r && scale.g && scale.b && scale.alpha) return scale as PipelineExtractArgs['scale'];
  return undefined;
}

/** Calculate a approximate scale from the band stats given a  */
function getScale(band: ImageryBandType, color: string): number | undefined {
  // No need to scale a uint8
  if (band.type === 'uint8') return undefined;
  // No stats to scale from
  if (band.stats == null) return undefined;
  const stdDevs = color === 'nir' ? 3 : 3;
  return Math.round(band.stats.mean + stdDevs * band.stats.stddev);
}

function getAlphaScale(band: ImageryBandType): number | undefined {
  if (band.type === 'uint8') return undefined;
  if (band.stats == null) return undefined;
  // TODO why does GDAL create a alpha that  has a max value of 32,768 which is half the max value of a uint16
  return Math.round(band.stats.max);
}
