/* eslint-disable @typescript-eslint/no-var-requires */
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const crypto = require('crypto');
const mime = require('mime-types');

const DistDir = './static';
const HashKey = 'linz-hash';

const s3 = new AWS.S3({ region: 'us-east-1' });
const cf = new AWS.CloudFormation({ region: 'us-east-1' });

async function getHash(Bucket, Key) {
    try {
        const obj = await s3.getObject({ Bucket, Key }).promise();
        return obj.Metadata[HashKey];
    } catch (e) {
        console.log('FailedToFetch', { Bucket, Key }, e);
    }
    return null;
}

/** If $GOOGLE_ANALYTICS is set, insert the tracking code into the index.html */
async function insertGoogleAnalytics() {
    const trackingId = process.env['GOOGLE_ANALYTICS'];
    if (trackingId == null || trackingId.trim() == '') return;

    const rawIndexHtml = await fs.readFile('./static/index.html');
    const trackingCode = `<script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', '${trackingId}');
    </script>
</head>`;

    // Put the tracking at the bottom of the index.html's head tag
    const outputHtml = rawIndexHtml.toString().replace('</head>', trackingCode);
    await fs.writeFile('./static/index.html', outputHtml);
}

/**
 * Deploy the built s3 assets into the Edge bucket
 *
 * TODO there does not appear to be a easy way to do this with aws-cdk yet
 */
async function deploy() {
    insertGoogleAnalytics();
    // Since the bucket is generated inside of CDK lets look up the bucket name
    const stackInfo = await cf.describeStacks({ StackName: 'Edge' }).promise();
    const bucket = stackInfo.Stacks[0].Outputs.find((f) => f.OutputKey == 'CloudFrontBucket');
    if (bucket == null) throw new Error('Failed to find EdgeBucket');

    const s3BucketName = bucket.OutputValue;

    const allBuckets = await s3.listBuckets().promise();
    const s3Bucket = allBuckets.Buckets.find((f) => f.Name == s3BucketName);
    if (s3Bucket == null) throw new Error('Failed to locate edge bucket in current account');

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

        console.log('Uploading', fileName, `${(fileData.byteLength / 1024).toFixed(2)}Kb`, hash);
        const res = await s3
            .putObject({
                Bucket: s3BucketName,
                Key: fileName,
                Body: fileData,
                Metadata: { [HashKey]: hash },
                ContentType: mime.lookup(fileName),
            })
            .promise();

        console.log('\tDone', res.ETag);
    }
}

deploy().catch(console.error);
