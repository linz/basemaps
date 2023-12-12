import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigProviderDynamo } from '../dynamo.config.js';

describe('ConfigProviderDynamo', () => {
  const Config = new ConfigProviderDynamo('table');

  describe('id', () => {
    it('should create ids', () => {
      assert.equal(Config.Provider.id('linz'), 'pv_linz');
    });
  });
});
