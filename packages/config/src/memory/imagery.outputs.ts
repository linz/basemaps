import { ConfigImagery } from '../config/imagery.js';
import { ConfigTileSetRaster, ConfigTileSetRasterOutput } from '../config/tile.set.js';
import { DefaultBandExpandOutput, DefaultColorRampOutput, DefaultTerrainRgbOutput } from '../config/tile.set.output.js';

export function addDefaultOutputPipelines(
  ts: ConfigTileSetRaster,
  img: ConfigImagery,
): ConfigTileSetRasterOutput[] | undefined {
  // Outputs already exist
  if (ts.outputs != null) return ts.outputs;

  // Unable to determine band information
  if (img.bands == null || img.bands.length === 0) return undefined;

  const colors = img.bands.map((m) => m.color).join(',');

  if (colors === 'gray') return [DefaultBandExpandOutput];

  // Likely elevation dataset as it is one band with no color interpretation
  if (colors === 'undefined' || img.bands.length === 1) return [DefaultTerrainRgbOutput, DefaultColorRampOutput];

  return undefined;
}
