import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { TileMatrixSet } from '@basemaps/geo';
import { Env } from '@basemaps/shared';
import { RoleConfig } from './imagery.find.js';

const MaxImagePixelSize = 128000;

export async function getJobCreationContext(
  path: string,
  tileMatrix: TileMatrixSet,
  role: RoleConfig,
  files: string[],
): Promise<JobCreationContext> {
  const bucket = Env.get(Env.ImportImageryBucket);
  if (bucket == null) throw new Error('Output AWS s3 bucket Not Found.');
  const ctx: JobCreationContext = {
    override: {
      projection: tileMatrix.projection,
      resampling: {
        warp: 'bilinear',
        overview: 'lanczos',
      },
      maxImageSize: MaxImagePixelSize,
    },
    outputLocation: { type: 's3' as const, path: `s3://${bucket}` },
    sourceLocation: { type: 's3', path, ...role, files: files },
    batch: true,
    tileMatrix,
    oneCogCovering: false,
  };
  return ctx;
}
