import { fsa, LogConfig } from '@basemaps/shared';
import CloudFormation from 'aws-sdk/clients/cloudformation.js';
import CloudFront from 'aws-sdk/clients/cloudfront.js';
import S3 from 'aws-sdk/clients/s3.js';
import { CliId } from './base.cli.js';
import crypto from 'crypto';

// Cloudfront has to be defined in us-east-1
const cloudFormation = new CloudFormation({ region: 'us-east-1' });
const cloudFront = new CloudFront({ region: 'us-east-1' });
const s3 = new S3({ region: 'us-east-1' });

/** cloudfront invalidation references need to be unique */
let InvalidationId = 0;

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateCache(path: string, commit = false): Promise<void> {
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
  if (commit) {
    await cloudFront
      .createInvalidation({
        DistributionId: cf.Id,
        InvalidationBatch: {
          Paths: { Quantity: 1, Items: [path] },
          CallerReference: `${CliId}-${InvalidationId++}`,
        },
      })
      .promise();
  }
}

export const HashKey = 'linz-hash';

export async function getHash(Bucket: string, Key: string): Promise<string | null> {
  try {
    const obj = await s3.getObject({ Bucket, Key }).promise();
    return obj.Metadata?.[HashKey] ?? null;
  } catch (e: any) {
    if (e.code === 'NoSuchKey') return null;
    throw e;
  }
}

/**
 * Lookup the static bucket from cloudformation
 * @returns
 */
let staticBucket: string | null = null;
export async function getStaticBucket(): Promise<string | null> {
  if (staticBucket != null) return staticBucket;
  // Since the bucket is generated inside of CDK lets look up the bucket name
  const stackInfo = await cloudFormation.describeStacks({ StackName: 'Edge' }).promise();
  const bucket = stackInfo.Stacks?.[0]?.Outputs?.find((f) => f.OutputKey === 'CloudFrontBucket');
  if (bucket == null) throw new Error('Failed to find EdgeBucket');
  staticBucket = bucket.OutputValue ?? null;
  return staticBucket;
}

/**
 * Upload a file to the static bucket
 * @param path source file
 * @param target target key @example '/foo/bar.html'
 * @param contentType http content type @example 'application/json'
 * @param cacheControl cache control headers @example 'public, max-age=604800, immutable'
 * @returns whether the item was updated
 */
export async function uploadStaticFile(
  path: string,
  target: string,
  contentType: string,
  cacheControl: string,
): Promise<boolean> {
  const fileData = await fsa.read(path);
  const hash = crypto.createHash('sha512').update(fileData).digest('base64');

  // S3 keys should not start with a `/`
  if (target.startsWith('/')) target = target.slice(1);

  const bucket = await getStaticBucket();
  if (bucket == null) throw new Error('Unable to find static bucket');

  const existing = await getHash(bucket, target);
  if (hash === existing) return false;

  await s3
    .putObject({
      Bucket: bucket,
      Key: target,
      Body: fileData,
      Metadata: { [HashKey]: hash },
      ContentType: contentType,
      CacheControl: cacheControl,
    })
    .promise();
  return true;
}
