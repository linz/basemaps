import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { TileMatrixSet } from '@basemaps/geo';
import { Env } from '@basemaps/shared';
import { RoleConfig } from './imagery.find.js';
import { basename } from 'path';

export async function getJobCreationContext(
  path: string,
  tileMatrix: TileMatrixSet,
  name: string | null,
  role: RoleConfig,
  files: string[],
): Promise<JobCreationContext> {
  const bucket = Env.get(Env.ImportImageryBucket);
  if (bucket == null) throw new Error('Output AWS s3 bucket Not Found.');
  const ctx: JobCreationContext = {
    imageryName: name != null ? name : basename(path),
    override: {
      projection: tileMatrix.projection,
      resampling: {
        warp: 'bilinear',
        overview: 'lanczos',
      },
    },
    outputLocation: { type: 's3' as const, path: `s3://${bucket}` },
    sourceLocation: { type: 's3', path, ...role, files: files },
    batch: true,
    tileMatrix,
    oneCogCovering: false,
  };
  return ctx;
}
