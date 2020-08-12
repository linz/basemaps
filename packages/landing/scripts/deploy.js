/* eslint-disable @typescript-eslint/no-var-requires */
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const crypto = require('crypto');
const mime = require('mime-types');
const invalidateCache = require('@basemaps/cli/build/cli/util').invalidateCache;

const DistDir = './dist';
const HashKey = 'linz-hash';

const s3 = new AWS.S3({ region: 'us-east-1' });
const cf = new AWS.CloudFormation({ region: 'us-east-1' });

async function getHash(Bucket, Key) {
    try {
        const obj = await s3.getObject({ Bucket, Key }).promise();
        return obj.Metadata[HashKey];
    } catch (e) {
        if (e.code == 'NoSuchKey') return null;
        console.log('FailedToFetch', { Bucket, Key }, e);
    }
    return null;
}

/**
 * Deploy the built s3 assets into the Edge bucket
 *
 * TODO there does not appear to be a easy way to do this with aws-cdk yet
 */
async function deploy() {
    // Since the bucket is generated inside of CDK lets look up the bucket name
    const stackInfo = await cf.describeStacks({ StackName: 'Edge' }).promise();
    const bucket = stackInfo.Stacks[0].Outputs.find((f) => f.OutputKey == 'CloudFrontBucket');
    if (bucket == null) throw new Error('Failed to find EdgeBucket');

    const s3BucketName = bucket.OutputValue;

    const allBuckets = await s3.listBuckets().promise();
    const s3Bucket = allBuckets.Buckets.find((f) => f.Name == s3BucketName);
    if (s3Bucket == null) throw new Error('Failed to locate edge bucket in current account');

    let hasChanges = false;
    const files = await fs.readdir(DistDir);
    for (const fileName of files) {
        const fileData = await fs.readFile(`${DistDir}/${fileName}`);
        const hash = crypto.createHash('sha512').update(fileData).digest('base64');

        const oldHash = await getHash(s3BucketName, fileName);
        // Only upload files if they have changed
        if (oldHash == hash) {
            console.log('Skipped', fileName, `${(fileData.byteLength / 1024).toFixed(2)}Kb`, hash);
            continue;
        }
        hasChanges = true;

        // Don't set cache control for index.html as it may change all other files are hashed and immutable
        const cacheControl = fileName == 'index.html' ? undefined : 'public, max-age=604800, immutable';

        console.log('Uploading', fileName, `${(fileData.byteLength / 1024).toFixed(2)}Kb`, hash);
        const res = await s3
            .putObject({
                Bucket: s3BucketName,
                Key: fileName,
                Body: fileData,
                Metadata: { [HashKey]: hash },
                ContentType: mime.contentType(fileName),
                CacheControl: cacheControl
            })
            .promise();

        console.log('\tDone', res.ETag);
    }

    if (hasChanges) await invalidateCache('/index.html', true);
    // TODO this should not live here.
    await invalidateCache('/v1/version', true);
}

deploy().catch(console.error);
