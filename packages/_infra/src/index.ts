import { App } from '@aws-cdk/core';
import { EdgeStack } from './edge';
import { ApiKeyTableStack } from './api.key.db';
import { ServeStack } from './serve';

const basemaps = new App();

/** Using VPC lookups requires a hard coded AWS "account" */
const account = process.env.CDK_DEFAULT_ACCOUNT;
/**
 * Because we are using Lambda@Edge the edge stack has to be deployed into us-east-1,
 * The dynamoDb table needs to be close to our users that has to be deployed in ap-southeast-2
 */
const table = new ApiKeyTableStack(basemaps, 'ApiKeyTable', { env: { region: 'ap-southeast-2', account } });
const edge = new EdgeStack(basemaps, 'Edge', { env: { region: 'us-east-1', account } });
new ServeStack(basemaps, 'Serve', { env: { region: 'ap-southeast-2', account } });

edge.addDependency(table);
// edge.addDependency(serve);
