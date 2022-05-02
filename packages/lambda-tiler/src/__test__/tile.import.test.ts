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

  o.afterEach(() => {
    sandbox.restore();
  });

  const tileMatrix = Nztm2000Tms;
  const bucket = 'testBucket';
  const path = `s3://${bucket}/imagery/`;
  const files = [`${path}/1.tiff`, `${path}/2.tiff`];
  const role: RoleConfig = {
    bucket,
    accountId: '123456',
    roleArn: 'arn:aws:iam::123456:role/read-role',
  };

  const ctx: JobCreationContext = {
    override: { projection: tileMatrix.projection, resampling: undefined },
    outputLocation: { type: 's3' as const, path: `s3://${Env.ImportImageryBucket}` },
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
    o(res.body).equals('{"status":500,"message":"Invalided s3 path"}');
  });

  o('should return Unable to access bucket', async () => {
    // Given... different bucket have no access role
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    const req = getRequest(`s3://wrong-bucket/imagery/`, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":500,"message":"Unable to Access the bucket"}');
  });

  o('should return Imagery not found', async () => {
    // Given... none imagery find from bucket
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'list').callsFake(async function* () {
      yield `${path}1.json`;
    });

    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.body).equals('{"status":404,"message":"Imagery Not Found"}');
  });

  o('should return 200 with new import', async () => {
    // Given... A new import with no existing config.
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'list').callsFake(async function* () {
      yield files[0];
      yield files[1];
    });
    sandbox.stub(CogJobFactory, 'create').resolves(undefined);

    sandbox.stub(Config.ProcessingJob, 'get').resolves(undefined);
    const req = getRequest(path, '2193');

    // When ...Then ...
    const res = await Import(req);
    o(res.status).equals(200);
    const jobConfig = {
      id: jobId,
      name: path,
      status: 'processing',
    };

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals(jobConfig);
  });

  o('should return 200 with existing import', async () => {
    // Given... different bucket have no access role
    sandbox.stub(fsa, 'readJson').resolves({ buckets: [role] });
    sandbox.stub(fsa, 'list').callsFake(async function* () {
      yield files[0];
      yield files[1];
    });
    sandbox.stub(CogJobFactory, 'create').resolves(undefined);

    const jobConfig = {
      id: jobId,
      name: path,
      status: 'processing',
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
