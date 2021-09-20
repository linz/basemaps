import { EpsgCode, NamedBounds, GoogleTms } from '@basemaps/geo';
import { CogStacJob } from '../cog.stac.job.js';
import { CogJobJson } from '../types.js';

export const SourceTiffTestHelper = {
  makeCogJob(): CogStacJob {
    return new CogStacJob({
      source: {
        files: [] as NamedBounds[],
        epsg: EpsgCode.Nztm2000,
        gsd: 0.8,
      },
      output: {
        tileMatrix: GoogleTms.identifier,
        gsd: 0.75,
        addAlpha: true,
        oneCogCovering: false,
      },
    } as CogJobJson);
  },

  tiffNztmBounds(path = '/path/to'): NamedBounds[] {
    return [
      {
        name: path + '/tiff1.tiff',
        x: 1732000,
        y: 5442000,
        width: 24000,
        height: 36000,
      },
      {
        name: path + '/tiff2.tiff',
        x: 1756000,
        y: 5442000,
        width: 24000,
        height: 36000,
      },
    ];
  },

  namedBoundsToPaths(bounds: NamedBounds[]): string[] {
    return bounds.map(({ name }): string => `/path/to/tiff${name}.tiff`);
  },
};
