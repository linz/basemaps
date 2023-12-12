import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { CloudFrontClient, CreateInvalidationCommand, ListDistributionsCommand } from '@aws-sdk/client-cloudfront';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fsa, LogConfig } from '@basemaps/shared';
import { CliId } from '@basemaps/shared/build/cli/info.js';
import crypto from 'crypto';
import path from 'path';
import slugify from 'slugify';
import { promisify } from 'util';
import { gzip } from 'zlib';

// Cloudfront has to be defined in us-east-1
const cloudFormationClient = new CloudFormationClient({ region: 'us-east-1' });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

/** cloudfront invalidation references need to be unique */
let InvalidationId = 0;

export function isRecord<T = unknown>(value: unknown): value is Record<string, T> {
  return typeof value === 'object' && value !== null;
}

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateCache(path: string | string[], commit = false): Promise<void> {
  const command = new DescribeStacksCommand({ StackName: 'Edge' });
  const response = await cloudFormationClient.send(command);
  if (response.Stacks?.[0].Outputs == null) {
    LogConfig.get().warn('Unable to find cloud front distribution');
    return;
  }
  const cloudFrontDomain = response.Stacks[0].Outputs.find((f) => f.OutputKey === 'CloudFrontDomain');
  const listDistributionCommand = new ListDistributionsCommand({});
  const cloudFrontDistributions = await cloudFrontClient.send(listDistributionCommand);
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
    const invalidationCommand = new CreateInvalidationCommand({
      DistributionId: cf.Id,
      InvalidationBatch: {
        Paths: { Quantity: Items.length, Items },
        CallerReference: `${CliId}-${InvalidationId++}`,
      },
    });
    await cloudFrontClient.send(invalidationCommand);
  }
}

export const HashKey = 'linz-hash';

export async function getHash(Bucket: string, Key: string): Promise<string | null> {
  try {
    const command = new HeadObjectCommand({ Bucket, Key });
    const obj = await s3Client.send(command);
    return obj.Metadata?.[HashKey] ?? null;
  } catch (e) {
    if (isRecord(e) && isRecord(e['$metadata']) && typeof e['$metadata']['httpStatusCode'] === 'number') {
      if (e['$metadata']['httpStatusCode'] === 404) return null;
    }

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
    const command = new DescribeStacksCommand({ StackName: 'Edge' });
    staticBucket = cloudFormationClient.send(command).then((stackInfo) => {
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
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: target,
    Body: contentEncoding === 'gzip' ? await gzipPromise(fileData, { level: 9 }) : fileData,
    Metadata: { [HashKey]: hash },
    ContentType: contentType,
    CacheControl: cacheControl,
    ContentEncoding: contentEncoding,
  });
  await s3Client.send(command);
  return true;
}

/**
 * Make a tile imagery title as imagery name
 * @example
 *  'Tasman rural 2018-19 0.3m' => 'tasman_rural_2018-19_0-3m'
 */
export function nameImageryTitle(title: string): string {
  return slugify
    .default(title.replace(/\.+/g, '-'), {
      replacement: '_',
      lower: true,
      trim: true,
    })
    .replace(/[^\w-_]/gi, '');
}
