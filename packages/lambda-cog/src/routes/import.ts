import { CogJobFactory } from '@basemaps/cli';
import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { ConfigProcessingJob, JobStatus } from '@basemaps/config';
import { Nztm2000QuadTms, TileMatrixSets } from '@basemaps/geo';
import { Config, Env, extractYearRangeFromName, fsa } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { basename } from 'path';
import * as ulid from 'ulid';
import { findImagery, RoleRegister } from '../import/imagery.find.js';

const MaxImagePixelSize = 128000;

/**
 * Trigger import imagery job by this endpoint
 *
 * @example
 * - /v1/import?path=s3://linz-imagery-staging/2022-03/wellington_rural_2022_delivery_1
 */
export async function Import(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const path = req.query.get('path');
  const projection = req.query.get('p');
  const id = ulid.ulid();

  // Parse projection as target, default to process both NZTM2000Quad
  let targetTms = Nztm2000QuadTms;
  if (projection != null) {
    const tileMatrix = TileMatrixSets.find(projection);
    if (tileMatrix == null) return new LambdaHttpResponse(404, 'Target projection Not found');
    targetTms = tileMatrix;
  }

  // Validate the s3 path
  if (path == null || !path.startsWith('s3://')) return new LambdaHttpResponse(400, `Invalid s3 path: ${path}`);

  const targetBucket = Env.get(Env.ImportImageryBucket);
  if (targetBucket == null) return new LambdaHttpResponse(400, `Invalid import bucket location`);

  // Check if the imagery name contains a year
  let imageryName = basename(path);
  const years = extractYearRangeFromName(imageryName);
  if (years[0] === -1) {
    const year = new Date().getFullYear().toString();
    imageryName = `${id}_${year}`;
  }

  // Find the imagery from s3
  const role = await RoleRegister.findRole(path);
  const fileInfo = await findImagery(path);
  if (fileInfo.files.length === 0) return new LambdaHttpResponse(404, 'Imagery Not Found');

  const files = fileInfo.files;
  const numberLimit = Env.getNumber(Env.ImportFilesNumberLimit, 10_000);
  const sizeLimitBytes = Env.getNumber(Env.ImportFilesSizeLimitGb, 1_200) * 1024 ** 3;
  const totalSizeInBytes = fileInfo.totalSize;
  if (files.length > numberLimit || totalSizeInBytes > sizeLimitBytes) {
    const totalSizeInGB = (fileInfo.totalSize / Math.pow(1024, 3)).toFixed(2);
    return new LambdaHttpResponse(
      400,
      `Too many files to process. Files: ${files.length}. TotalSize: ${totalSizeInGB}GB`,
    );
  }

  // Prepare Cog jobs
  const ctx: JobCreationContext = {
    override: {
      projection: targetTms.projection,
      resampling: {
        warp: 'bilinear',
        overview: 'lanczos',
      },
      maxImageSize: MaxImagePixelSize,
    },
    outputLocation: { type: 's3', path: fsa.join(`s3://${targetBucket}`, 'cache') },
    sourceLocation: { type: 's3', path, ...role, files: files },
    batch: true,
    tileMatrix: targetTms,
    oneCogCovering: false,
  };

  const hash = createHash('sha256').update(JSON.stringify(ctx)).digest('base64');
  const jobId = Config.ProcessingJob.id(hash);
  let jobConfig = await Config.ProcessingJob.get(jobId);
  if (jobConfig == null) {
    // Add ids into JobCreationContext
    ctx.imageryName = imageryName;
    if (ctx.override == null) ctx.override = {};
    ctx.override.id = id;
    ctx.override.processingId = jobId;
    ctx.outputLocation.path = fsa.join(ctx.outputLocation.path, id);

    // Insert Processing job config
    jobConfig = {
      id: jobId,
      name: path,
      status: JobStatus.Processing,
      tileMatrix: targetTms.identifier,
      tileSet: Config.TileSet.id(id),
    } as ConfigProcessingJob;

    // Start processing job
    await CogJobFactory.create(ctx);

    // Insert the configs after submit the jobs
    if (Config.ProcessingJob.isWriteable()) await Config.ProcessingJob.put(jobConfig);
    else return new LambdaHttpResponse(403, 'Unable to insert the Processing Job config');
  }

  const json = JSON.stringify(jobConfig);
  const data = Buffer.from(json);

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
