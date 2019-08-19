import { App } from '@aws-cdk/core';
import { EdgeStack } from './edge';
import { ApiKeyTableStack } from './api.key.db';

const basemaps = new App();

/**
 * Because we are using Lambda@Edge the edge stack has to be deployed into us-east-1,
 * The dynamoDb table needs to be close to our users that has to be deployed in ap-southeast-2
 */
const table = new ApiKeyTableStack(basemaps, 'ApiKeyTable', { env: { region: 'ap-southeast-2' } });
const edge = new EdgeStack(basemaps, 'Edge', { env: { region: 'us-east-1' } });

edge.addDependency(table);
