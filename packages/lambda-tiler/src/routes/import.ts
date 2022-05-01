import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Config } from '@basemaps/shared';
import { createHash } from 'crypto';
import { findImagery } from '../import/imagery.find.js';
import { Nztm2000Tms, TileMatrixSets } from '@basemaps/geo';
import { makeCog } from '../import/make.cog.js';
import { ProcessingJob } from '@basemaps/config/src/config/processing.job';
import { AwsRole, prepareRoles } from '../import/aws.js';
import { CogJobFactory } from '@basemaps/cli';

// Bucket access roles
let roles: Promise<AwsRole[]> | null = null;

/**
 * Trigger import imagery job by this endpoint
 *
 * @example
 * - /v1/import?path=s3://linz-imagery-staging/2022-03/wellington_rural_2022_delivery_1
 */
export async function Import(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const path = req.query.get('path');
  const projection = req.query.get('p');

  // Get all data lake access roles
  if (roles == null) roles = prepareRoles();

  // Parse projection as target, default to process both NZTM2000Quad
  let target = Nztm2000Tms;
  if (projection != null) {
    const tileMatrix = TileMatrixSets.find(projection);
    if (tileMatrix == null) return new LambdaHttpResponse(404, 'Target projection Not found');
    target = tileMatrix;
  }

  // Find the imagery from s3
  if (path == null || !path.startsWith('s3://')) return new LambdaHttpResponse(500, 'Invalided s3 path');
  const source = await findImagery(path);
  if (source == null) return new LambdaHttpResponse(404, 'Imagery Not Found');

  // Get file list
  const s3 = source.config.s3;
  const keys = s3.list(path);
  const files: string[] = [];
  for await (const key of keys) {
    if (key.endsWith('.tiff')) files.push(key);
  }

  // Prepare Cog jobs
  const ctx = await makeCog(path, target, source, files);

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
    } as ProcessingJob;
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
