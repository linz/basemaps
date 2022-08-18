import { JobCreationContext } from '@basemaps/cli/build/cog/cog.stac.job';
import { Nztm2000Tms } from '@basemaps/geo';
import { CompositeError, Env, fsa, getDefaultConfig, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { createHash } from 'crypto';
import sinon from 'sinon';
import { LambdaAlbRequest, LambdaHttpRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { Import } from '../routes/import.js';
import { RoleConfig } from '@basemaps/shared';
import { CogJobFactory } from '@basemaps/cli';
import { ConfigId, ConfigPrefix, ConfigProcessingJob } from '@basemaps/config';

o.spec('Import', () => {
  const sandbox = sinon.createSandbox();
  const outputBucket = 'testOutputBucket';
  const configBucket = 'testConfigBucket';
  const fileNumberLimit = '5';
  const fileSizeLimit = '2';
  const origConfigBucket = process.env[Env.AwsRoleConfigPath];
  const origOutputBucket = process.env[Env.ImportImageryBucket];
  const origFileNumberLimit = process.env[Env.ImportFilesNumberLimit];
  const origFileSizeLimit = process.env[Env.ImportFilesSizeLimitGb];
  o.beforeEach(() => {
    process.env[Env.AwsRoleConfigPath] = configBucket;
    process.env[Env.ImportImageryBucket] = outputBucket;
    process.env[Env.ImportFilesNumberLimit] = fileNumberLimit;
    process.env[Env.ImportFilesSizeLimitGb] = fileSizeLimit;
  });

  o.afterEach(() => {
    process.env[Env.AwsRoleConfigPath] = origConfigBucket;
    process.env[Env.ImportImageryBucket] = origOutputBucket;
    process.env[Env.ImportFilesNumberLimit] = origFileNumberLimit;
    process.env[Env.ImportFilesSizeLimitGb] = origFileSizeLimit;
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
  async function* listEmpty(): AsyncGenerator<string> {
    // Noop
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
  const jobId = ConfigId.prefix(ConfigPrefix.ProcessingJob, id);

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
    async function* listException(): AsyncGenerator<string> {
      throw new CompositeError('Access Denied', 403, new Error());
    }

    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'list').callsFake(listException);

    const req = getRequest(`s3://wrong-bucket/imagery/`, '2193');

    // When ...Then ...
    try {
      await Import(req);
      o(true).equals(false); // should have failed
    } catch (e) {
      o(String(e)).equals('Error: Failed to read s3://wrong-bucket/imagery/');
    }
  });

  o('should return Imagery not found', async () => {
    // Given... none imagery find from bucket
    sandbox.stub(fsa, 'list').callsFake(listEmpty);
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
    sandbox.stub(fsa, 'list').callsFake(listEmpty);

    const jobConfig = {
      id: jobId,
      name: path,
      status: 'complete',
    } as ConfigProcessingJob;

    sandbox.stub(getDefaultConfig().ProcessingJob, 'get').resolves(jobConfig);
    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.status).equals(200);
    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals(jobConfig);
  });

  o('should return 400 with reach file number limit', async () => {
    // Given... different bucket have no access role
    async function* listTooManyFiles(): AsyncGenerator<{ path: string; size: number }, any, unknown> {
      const files = [
        `${path}/1.tiff`,
        `${path}/2.tiff`,
        `${path}/3.tiff`,
        `${path}/4.tiff`,
        `${path}/5.tiff`,
        `${path}/6.tiff`,
      ];
      for (const key in files) yield { path: files[key], size: 300_000_000 };
    }
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'details').callsFake(listTooManyFiles);
    sandbox.stub(CogJobFactory, 'create').resolves(undefined);
    sandbox.stub(fsa, 'list').callsFake(listEmpty);

    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":400,"message":"Too many files to process. Files: 6. TotalSize: 1.68GB"}');
  });

  o('should return 400 with reach file size limit', async () => {
    // Given... different bucket have no access role
    async function* listTooLargeFiles(): AsyncGenerator<{ path: string; size: number }, any, unknown> {
      const files = [`${path}/1.tiff`];
      for (const key in files) yield { path: files[key], size: 3_000_000_000 };
    }
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'details').callsFake(listTooLargeFiles);
    sandbox.stub(fsa, 'list').callsFake(listEmpty);

    sandbox.stub(CogJobFactory, 'create').resolves(undefined);
    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals(`{"status":400,"message":"Too many files to process. Files: 1. TotalSize: 2.79GB"}`);
  });
});