import { fsa, LogConfig } from '@basemaps/shared';
import { CliId } from '@basemaps/shared/build/cli/info.js';
import CloudFormation from 'aws-sdk/clients/cloudformation.js';
import CloudFront from 'aws-sdk/clients/cloudfront.js';
import S3 from 'aws-sdk/clients/s3.js';
import crypto from 'crypto';
import path from 'path';
import slugify from 'slugify';
import { promisify } from 'util';
import { gzip } from 'zlib';

// Cloudfront has to be defined in us-east-1
const cloudFormation = new CloudFormation({ region: 'us-east-1' });
const cloudFront = new CloudFront({ region: 'us-east-1' });
const s3 = new S3({ region: 'us-east-1' });

/** cloudfront invalidation references need to be unique */
let InvalidationId = 0;

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateCache(path: string | string[], commit = false): Promise<void> {
  const stackInfo = await cloudFormation.describeStacks({ StackName: 'Edge' }).promise();
  if (stackInfo.Stacks?.[0].Outputs == null) {
    LogConfig.get().warn('Unable to find cloud front distribution');
    return;
  }
  const cloudFrontDomain = stackInfo.Stacks[0].Outputs.find((f) => f.OutputKey === 'CloudFrontDomain');

  const cloudFrontDistributions = await cloudFront.listDistributions().promise();
  const cf = cloudFrontDistributions.DistributionList?.Items?.find(
    (f) => f.DomainName === cloudFrontDomain?.OutputValue,
  );

  if (cloudFrontDomain == null || cf == null) {
    LogConfig.get().warn('Unable to find cloud front distribution');
    return;
  }

  LogConfig.get().info({ path, cfId: cf.Id }, 'Invalidating');
  const Items = Array.isArray(path) ? path : [path];
  if (commit) {
    await cloudFront
      .createInvalidation({
        DistributionId: cf.Id,
        InvalidationBatch: {
          Paths: { Quantity: Items.length, Items },
          CallerReference: `${CliId}-${InvalidationId++}`,
        },
      })
      .promise();
  }
}

export const HashKey = 'linz-hash';

export async function getHash(Bucket: string, Key: string): Promise<string | null> {
  try {
    const obj = await s3.headObject({ Bucket, Key }).promise();
    return obj.Metadata?.[HashKey] ?? null;
  } catch (e: any) {
    if (e.code === 'NoSuchKey') return null;
    if (e.code === 'NotFound') return null;
    throw e;
  }
}

/**
 * Lookup the static bucket from cloudformation
 * @returns
 */
let staticBucket: Promise<string> | undefined;
export function getStaticBucket(): Promise<string> {
  if (staticBucket == null) {
    // Since the bucket is generated inside of CDK lets look up the bucket name
    staticBucket = cloudFormation
      .describeStacks({ StackName: 'Edge' })
      .promise()
      .then((stackInfo) => {
        const val = stackInfo.Stacks?.[0]?.Outputs?.find((f) => f.OutputKey === 'CloudFrontBucket')?.OutputValue;
        if (val == null) throw new Error('Failed to find EdgeBucket');
        return val;
      });
  }
  return staticBucket;
}

/** Extensions that should be gzipped before uploading */
const CompressExt = new Set(['.js', '.html', '.css', '.map', '.json', '.svg']);
const gzipPromise = promisify(gzip);

/**
 * Upload a file to the static bucket
 * @param path source file
 * @param target target key @example '/foo/bar.html'
 * @param contentType http content type @example 'application/json'
 * @param cacheControl cache control headers @example 'public, max-age=604800, immutable'
 * @returns whether the item was updated
 */
export async function uploadStaticFile(
  filePath: string,
  target: string,
  contentType: string,
  cacheControl: string,
): Promise<boolean> {
  const fileData = await fsa.read(filePath);
  const hash = crypto.createHash('sha512').update(fileData).digest('base64');

  // S3 keys should not start with a `/`
  if (target.startsWith('/')) target = target.slice(1);
  const bucket = await getStaticBucket();
  if (bucket == null) throw new Error('Unable to find static bucket');

  const existing = await getHash(bucket, target);
  if (hash === existing) return false;

  // Should we compress the file before uploading
  const ext = path.extname(target);
  const contentEncoding = CompressExt.has(ext) ? 'gzip' : undefined;

  await s3
    .putObject({
      Bucket: bucket,
      Key: target,
      Body: contentEncoding === 'gzip' ? await gzipPromise(fileData, { level: 9 }) : fileData,
      Metadata: { [HashKey]: hash },
      ContentType: contentType,
      CacheControl: cacheControl,
      ContentEncoding: contentEncoding,
    })
    .promise();
  return true;
}

/**
 * Make a tile imagery title as imagery name
 * @example
 *  'Tasman rural 2018-19 0.3m' => 'tasman_rural_2018-19_0-3m'
 */
export function nameImageryTitle(title: string): string {
  return slugify(title.replace(/\.+/g, '-'), {
    replacement: '_',
    lower: true,
    trim: true,
  }).replace(/[^\w-_]/gi, '');
}
