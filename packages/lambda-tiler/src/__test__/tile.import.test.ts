import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { Nztm2000Tms } from '@basemaps/geo';
import { Config, Env, fsa, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { createHash } from 'crypto';
import sinon from 'sinon';
import { LambdaAlbRequest, LambdaHttpRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { Import } from '../routes/import.js';
import { RoleConfig } from '../import/imagery.find.js';
import { CogJobFactory } from '@basemaps/cli';
import { ConfigProcessingJob } from '@basemaps/config';

o.spec('Import', () => {
  const sandbox = sinon.createSandbox();
  const outputBucket = 'testOutputBucket';
  const configBucket = 'testConfigBucket';
  const origConfigBucket = process.env[Env.AwsRoleConfigBucket];
  const origOutputBucket = process.env[Env.ImportImageryBucket];
  o.beforeEach(() => {
    process.env[Env.AwsRoleConfigBucket] = configBucket;
    process.env[Env.ImportImageryBucket] = outputBucket;
  });

  o.afterEach(() => {
    process.env[Env.AwsRoleConfigBucket] = origConfigBucket;
    process.env[Env.ImportImageryBucket] = origOutputBucket;
    sandbox.restore();
  });

  const tileMatrix = Nztm2000Tms;
  const bucket = 'testSourceBucket';
  const path = `s3://${bucket}/imagery/`;
  const role: RoleConfig = {
    bucket,
    accountId: '123456',
    roleArn: 'arn:aws:iam::123456:role/read-role',
  };

  const files = [`${path}/1.tiff`, `${path}/2.tiff`];
  async function* listFiles(): AsyncGenerator<{ path: string; size: number }, any, unknown> {
    for (const key in files) yield { path: files[key], size: 40_000_000 };
  }

  const ctx: JobCreationContext = {
    override: {
      projection: tileMatrix.projection,
      resampling: {
        warp: 'bilinear',
        overview: 'lanczos',
      },
    },
    outputLocation: { type: 's3' as const, path: `s3://${outputBucket}` },
    sourceLocation: { type: 's3', path: path, ...role, files: files },
    batch: true,
    tileMatrix,
    oneCogCovering: false,
  };

  const id = createHash('sha256').update(JSON.stringify(ctx)).digest('base64');
  const jobId = Config.ProcessingJob.id(id);

  function getRequest(path: string, projection: string): LambdaHttpRequest {
    return new LambdaAlbRequest(
      {
        requestContext: null as any,
        httpMethod: 'get',
        path: '/v1/tiles/import',
        body: null,
        isBase64Encoded: false,
        queryStringParameters: { path: path, p: projection },
      },
      {} as Context,
      LogConfig.get(),
    );
  }

  o('should return projection not found', async () => {
    // Given ... wrong projection
    const req = getRequest(path, '0000');

    // When ... Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":404,"message":"Target projection Not found"}');
  });

  o('should return Invalid s3 location', async () => {
    // Given... wrong s3 path
    const req = getRequest('s3::testbucket/', '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":400,"message":"Invalid s3 path: s3::testbucket/"}');
  });

  o('should return Unable to access bucket', async () => {
    // Given... different bucket have no access role
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    const req = getRequest(`s3://wrong-bucket/imagery/`, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":403,"message":"Unable to Access the s3 bucket"}');
  });

  o('should return Imagery not found', async () => {
    // Given... none imagery find from bucket
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'details').callsFake(async function* () {
      yield { path: `${path}1.json`, size: 4000000 };
    });

    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":404,"message":"Imagery Not Found"}');
  });

  o('should return 200 with existing import', async () => {
    // Given... different bucket have no access role
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'details').callsFake(listFiles);
    sandbox.stub(CogJobFactory, 'create').resolves(undefined);

    const jobConfig = {
      id: jobId,
      name: path,
      status: 'complete',
    } as ConfigProcessingJob;
    sandbox.stub(Config.ProcessingJob, 'get').resolves(jobConfig);
    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.status).equals(200);
    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals(jobConfig);
  });
});
