import { App } from '@aws-cdk/core';
import { ApiKeyTableStack } from './api.key.db';
import { CogBuilderStack } from './cogify';
import { EdgeStack } from './edge';
import { ServeStack } from './serve';
import { DeployEnv } from './deploy.env';
import { Env } from '@basemaps/lambda-shared';

const basemaps = new App();

/** Using VPC lookups requires a hard coded AWS "account" */
const account = Env.get(DeployEnv.CdkAccount);

/**
 * Because we are using Lambda@Edge the edge stack has to be deployed into us-east-1,
 * The dynamoDb table needs to be close to our users that has to be deployed in ap-southeast-2
 */
const table = new ApiKeyTableStack(basemaps, 'ApiKeyTable', { env: { region: 'ap-southeast-2', account } });
const edge = new EdgeStack(basemaps, 'Edge', { env: { region: 'us-east-1', account } });
const serve = new ServeStack(basemaps, 'Serve', { env: { region: 'ap-southeast-2', account } });

edge.addDependency(table);
edge.addDependency(serve);

new CogBuilderStack(basemaps, 'CogBuilder', { env: { region: 'ap-southeast-2', account } });
