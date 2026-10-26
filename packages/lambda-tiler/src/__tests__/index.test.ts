import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';

import { getClientIp, handler } from '../index.js';
import { ConfigLoader } from '../util/config.loader.js';
import { mockRequest } from './xyz.util.js';

describe('LambdaXyz index', () => {
  it('should export handler', async () => {
    const foo = await import('../index.js');
    assert.equal(typeof foo.handler, 'function');
  });

  describe('getClientIp', () => {
    const ip = (addr?: string): string | undefined => {
      return getClientIp(mockRequest('/v1/version', 'get', addr ? { 'cloudfront-viewer-address': addr } : {}));
    };

    it('should strip the port from ipv4', () => {
      assert.equal(ip('203.0.113.10:46532'), '203.0.113.10');
    });

    it('should strip the port from ipv6 and keep brackets', () => {
      assert.equal(ip('[2001:db8::1]:46532'), '[2001:db8::1]');
    });

    it('should handle missing ports', () => {
      assert.equal(ip('203.0.113.10'), '203.0.113.10');
      assert.equal(ip('[2001:db8::1]'), '[2001:db8::1]');
    });

    it('should return undefined when header is missing', () => {
      assert.equal(ip(), undefined);
    });
  });

  describe('version', () => {
    afterEach(() => {
      delete process.env['GIT_VERSION'];
      delete process.env['GIT_HASH'];
      delete process.env['BUILD_ID'];
    });

    it('should return version', async (t) => {
      const config = new ConfigProviderMemory();
      t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

      process.env['GIT_VERSION'] = '1.2.3';
      process.env['GIT_HASH'] = 'abc456';

      const response = await handler.router.handle(mockRequest('/v1/version'));

      assert.equal(response.status, 200);
      assert.equal(response.statusDescription, 'ok');
      assert.equal(response.header('cache-control'), 'no-store');
      assert.deepEqual(JSON.parse(response.body), {
        version: '1.2.3',
        hash: 'abc456',
      });
    });

    it('should include buildId if exists', async (t) => {
      const config = new ConfigProviderMemory();
      t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

      process.env['GIT_VERSION'] = '1.2.3';
      process.env['BUILD_ID'] = '1658821493-3';

      const response = await handler.router.handle(mockRequest('/v1/version'));

      assert.equal(response.status, 200);
      assert.equal(response.statusDescription, 'ok');
      assert.equal(response.header('cache-control'), 'no-store');
      assert.deepEqual(JSON.parse(response.body), {
        version: '1.2.3',
        buildId: '1658821493-3',
      });
    });

    it('should return config information if present', async (t) => {
      const config = new ConfigProviderMemory();
      t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);
      config.id = 'config-id';

      const response = await handler.router.handle(mockRequest('/v1/version'));
      assert.deepEqual(JSON.parse(response.body), {
        version: 'dev',
        config: { id: 'config-id' },
      });

      config.hash = 'config-hash';
      const responseHash = await handler.router.handle(mockRequest('/v1/version'));
      assert.deepEqual(JSON.parse(responseHash.body), {
        version: 'dev',
        config: { id: 'config-id', hash: 'config-hash' },
      });
    });
  });

  it('should respond to /ping', async () => {
    const res = await handler.router.handle(mockRequest('/v1/ping'));
    assert.equal(res.status, 200);
    assert.equal(res.statusDescription, 'ok');
    assert.equal(res.header('cache-control'), 'no-store');
  });
});
