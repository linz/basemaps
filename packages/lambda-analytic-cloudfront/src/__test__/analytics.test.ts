import assert from 'node:assert';
import { afterEach, beforeEach, describe, it, TestContext } from 'node:test';
import { gzipSync } from 'node:zlib';

import { Env, fsa, FsMemory, LogConfig } from '@basemaps/shared';
import { Client } from '@elastic/elasticsearch';
import { LambdaRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';

import { getOneHourAgo, getYesterday } from '../date.js';
import { Elastic } from '../elastic.js';
import { main } from '../handler.js';
import { LogStats } from '../log.stats.js';
import { LogData } from './log.data.js';

interface IndexOperation {
  index: { _index: string };
}
type BulkOperation = (IndexOperation | LogStats)[];

export class FakeLambdaRequest extends LambdaRequest {
  constructor() {
    super({}, {} as Context, LogConfig.get());
  }
}

describe('analytic lambda', () => {
  const memory = new FsMemory();
  beforeEach(() => {
    fsa.register('mem://', memory);
    memory.files.clear();

    Elastic.indexDelay = 1; // do not wait between requests
    Elastic.minRequestCount = 0; // index everything
    Elastic._client = undefined;
    LogConfig.get().level = 'silent';
  });

  afterEach(() => {
    LogConfig.get().level = 'info';
  });

  function setupEnv(t: TestContext): void {
    t.mock.method(Env, 'get', (key: string): string => {
      switch (key) {
        case Env.Analytics.ElasticIndexName:
          return 'basemaps-history';
        case Env.Analytics.CacheBucket:
          return 'mem://cache/';
        case Env.Analytics.CloudFrontSourceBucket:
          return 'mem://source/';
        case Env.Analytics.CloudFrontId:
          return 'cfid';
        case Env.Analytics.MaxRecords:
          return '1';
      }
      throw new Error(`Invalid test process.env access ${key}`);
    });
  }

  it('should process some log data', async (t) => {
    setupEnv(t);

    const operations: BulkOperation[] = [];
    Elastic._client = {
      bulk(op: { operations: BulkOperation }) {
        operations.push(op.operations);
        return Promise.resolve({});
      },
    } as unknown as Client;

    const oneHourAgo = getOneHourAgo();
    const shortDate = oneHourAgo.toISOString().slice(0, 13).replace('T', '-');
    await fsa.write(new URL(`mem://source/cfid.${shortDate}/data.txt.gz`), gzipSync(LogData));

    await main(new FakeLambdaRequest());

    // One call to insert
    assert.equal(operations.length, 1);

    const op = operations[0];

    const indexOpt = op[0] as IndexOperation;
    const logOpt = op[1] as LogStats;

    // First Log line: /v1/tiles/aerial/EPSG:3857/19/516588/320039.webp
    assert.equal(indexOpt.index._index, 'basemaps-history-2020');
    assert.equal(logOpt.apiType, 'd');
    assert.equal(logOpt.tileMatrix, 'EPSG:3857');
    assert.equal(logOpt.tileMatrixId, 'WebMercatorQuad');
    assert.equal(logOpt.tileSet, 'aerial');
    assert.equal(logOpt.z, 19);
    assert.equal(logOpt.cacheHit, 1);
    assert.equal(logOpt.cacheMiss, 0);
    assert.equal(logOpt.total, 1);

    assert.deepEqual(logOpt.ua, { os: 'linux', name: 'chrome', version: '85', variant: 'unknown' });

    const files = [...memory.files.keys()];
    assert.equal(files.length, 2); // two files one input one output

    assert.equal(
      files[1],
      `mem://cache/RollUpV3/${shortDate.slice(0, 4)}/${shortDate.slice(5, 7)}/${shortDate}.ndjson.gz`,
    );
  });

  it('should write errors to storage', async (t) => {
    setupEnv(t);

    Elastic._client = {
      bulk() {
        return Promise.resolve({ errors: ['Hello'] });
      },
    } as unknown as Client;

    const oneHourAgo = getOneHourAgo();
    const shortDate = oneHourAgo.toISOString().slice(0, 13).replace('T', '-');
    await fsa.write(new URL(`mem://source/cfid.${shortDate}/data.txt.gz`), gzipSync(LogData));

    const ret = await main(new FakeLambdaRequest()).catch((e: Error) => e);

    assert.equal(String(ret), 'Error: Failed to index');

    const files = [...memory.files.keys()];
    assert.equal(files.length, 2); // two files one input one output

    assert.ok(files[1].startsWith(`mem://cache/errors-${new Date().toISOString().slice(0, 12)}`));

    const data = await fsa.read(new URL(files[1]));
    assert.ok(data.toString().includes(JSON.stringify('Hello')));
  });
});
