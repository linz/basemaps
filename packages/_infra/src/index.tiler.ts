import { Env } from '@basemaps/shared';
import { App } from 'aws-cdk-lib';
import { BaseMapsRegion } from './config.js';
import { DeployEnv } from './deploy.env.js';
import { TilerFunction } from './serve/tiler.function.js';

const basemaps = new App();
const account = Env.get(DeployEnv.CdkAccount);

new TilerFunction(basemaps, 'TilerFunction', {
  env: { region: BaseMapsRegion, account },
  config: 's3://basemaps-cog-test/config-latest.json.gz',
});
