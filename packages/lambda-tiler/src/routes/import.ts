import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Config } from '@basemaps/shared';
import { createHash } from 'crypto';
import { findImagery, RoleRegister } from '../import/imagery.find.js';
import { Nztm2000Tms, TileMatrixSets } from '@basemaps/geo';
import { makeCog } from '../import/make.cog.js';
import { ConfigProcessingJob } from '@basemaps/config';
import { CogJobFactory } from '@basemaps/cli';

/**
 * Trigger import imagery job by this endpoint
 *
 * @example
 * - /v1/import?path=s3://linz-imagery-staging/2022-03/wellington_rural_2022_delivery_1
 */
export async function Import(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const path = req.query.get('path');
  const projection = req.query.get('p');

  // Parse projection as target, default to process both NZTM2000Quad
  let target = Nztm2000Tms;
  if (projection != null) {
    const tileMatrix = TileMatrixSets.find(projection);
    if (tileMatrix == null) return new LambdaHttpResponse(404, 'Target projection Not found');
    target = tileMatrix;
  }

  // Find the imagery from s3
  if (path == null || !path.startsWith('s3://')) return new LambdaHttpResponse(500, 'Invalided s3 path');
  await RoleRegister.loadRoles();
  const role = await RoleRegister.findRole(path);
  if (role == null) return new LambdaHttpResponse(500, 'Unable to Access the bucket');
  const files = await findImagery(path);
  if (files.length < 1) return new LambdaHttpResponse(404, 'Imagery Not Found');

  // Prepare Cog jobs
  const ctx = await makeCog(path, target, role, files);

  const id = createHash('sha256').update(JSON.stringify(ctx)).digest('base64');
  const jobId = Config.ProcessingJob.id(id);
  let jobConfig = await Config.ProcessingJob.get(jobId);
  if (jobConfig == null) {
    // Start processing job
    ctx.override!.id = id;
    await CogJobFactory.create(ctx);
    jobConfig = {
      id: jobId,
      name: path,
      status: 'processing',
    } as ConfigProcessingJob;
  }

  const json = JSON.stringify(jobConfig);
  const data = Buffer.from(json);
  const cacheKey = createHash('sha256').update(data).digest('base64');

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
