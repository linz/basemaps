import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { Epsg, TileMatrixSet } from '@basemaps/geo';
import { Env } from '@basemaps/shared';
import { Source } from './imagery.find.js';

export async function makeCog(
  path: string,
  tileMatrix: TileMatrixSet,
  source: Source,
  files: string[],
): Promise<JobCreationContext> {
  let resampling;

  /** Process Gebco 2193 as one cog of full extent to avoid antimeridian problems */
  if (tileMatrix.projection === Epsg.Nztm2000 && path.includes('gebco')) {
    resampling = {
      warp: 'nearest', // GDAL doesn't like other warp settings when crossing antimeridian
      overview: 'lanczos',
    } as const;
  }

  if (path.includes('geographx')) {
    resampling = {
      warp: 'bilinear',
      overview: 'bilinear',
    } as const;
  }

  const ctx: JobCreationContext = {
    override: { projection: tileMatrix.projection, resampling },
    outputLocation: { type: 's3' as const, path: `s3://${Env.ImportImageryBucket}` },
    sourceLocation: { type: 's3', path: source.uri, ...source.config.role, files: files },
    batch: true,
    tileMatrix,
    oneCogCovering: false,
  };
  return ctx;
}
