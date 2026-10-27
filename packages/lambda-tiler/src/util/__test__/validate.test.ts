import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';

import { mockUrlRequest } from '../../__tests__/xyz.util.js';
import { getClientIp, normalizeIp, Validate } from '../validate.js';

describe('Validate.blockedApiKeys', () => {
  const validApiKey = 'c01jswmpe1yn3mwne7e0ggtp8vg';
  it('should disable api keys', () => {
    const req = mockUrlRequest('/v1/blank', `api=${validApiKey}`);
    const parsedKey = Validate.apiKey(req);
    assert.equal(parsedKey, validApiKey);
  });

  it('should disable api keys', () => {
    const req = mockUrlRequest('/v1/blank', `api=${validApiKey}`);
    Validate.blockedApiKeys.add(validApiKey);
    assert.throws(() => Validate.apiKey(req));

    Validate.blockedApiKeys.delete(validApiKey);
    assert.equal(Validate.apiKey(req), validApiKey);
  });
});

describe('Validate.blockedClientIps', () => {
  const viewer = (addr?: string): ReturnType<typeof mockUrlRequest> =>
    mockUrlRequest('/v1/blank', '', addr ? { 'cloudfront-viewer-address': addr } : {});

  it('should get client ip without port', () => {
    assert.equal(getClientIp(viewer('203.0.113.10:46532')), '203.0.113.10');
    assert.equal(getClientIp(viewer('[2001:db8::1]:46532')), '[2001:db8::1]');
    assert.equal(getClientIp(viewer('203.0.113.10')), '203.0.113.10');
    assert.equal(getClientIp(viewer('[2001:db8::1]')), '[2001:db8::1]');
    assert.equal(getClientIp(viewer()), undefined);
  });

  it('should normalize ips', () => {
    assert.equal(normalizeIp(' 203.0.113.10 '), '203.0.113.10');
    assert.equal(normalizeIp('2001:DB8::1'), '[2001:db8::1]');
    assert.equal(normalizeIp('[2001:db8::1]'), '[2001:db8::1]');
  });

  it('should block ipv4 clients', () => {
    const req = viewer('203.0.113.10:46532');
    assert.equal(Validate.clientIp(req), '203.0.113.10');

    Validate.blockedClientIps.add(normalizeIp('203.0.113.10'));
    assert.throws(() => Validate.clientIp(req));
    assert.equal(Validate.clientIp(viewer('203.0.113.11:46532')), '203.0.113.11');

    Validate.blockedClientIps.delete(normalizeIp('203.0.113.10'));
    assert.equal(Validate.clientIp(req), '203.0.113.10');
  });

  it('should block ipv6 clients', () => {
    const req = viewer('[2001:db8::1]:46532');
    Validate.blockedClientIps.add(normalizeIp('2001:DB8::1'));
    assert.throws(() => Validate.clientIp(req));
    Validate.blockedClientIps.delete(normalizeIp('2001:DB8::1'));
    assert.equal(Validate.clientIp(req), '[2001:db8::1]');
  });

  it('should allow requests without a client address', () => {
    assert.equal(Validate.clientIp(viewer()), undefined);
  });
});

describe('GetImageFormats', () => {
  it('should parse all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    assert.deepEqual(formats, ['png', 'jpeg']);
  });

  it('should ignore bad formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=fake&format=mvt');
    const formats = Validate.getRequestedFormats(req);
    assert.equal(formats, null);
  });

  it('should de-dupe formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=png&format=jpeg&format=png&format=jpeg&format=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    assert.deepEqual(formats, ['png', 'jpeg']);
  });

  it('should support "tileFormat" Alias all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'tileFormat=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    assert.deepEqual(formats, ['jpeg', 'png']);
  });

  it('should not duplicate "tileFormat" alias all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'tileFormat=jpeg&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    assert.deepEqual(formats, ['jpeg']);
  });
});

describe('getTileMatrixSet', () => {
  it('should lookup epsg codes', () => {
    assert.equal(Validate.getTileMatrixSet('EPSG:3857')?.identifier, GoogleTms.identifier);
    assert.equal(Validate.getTileMatrixSet('EPSG:2193')?.identifier, Nztm2000Tms.identifier);

    assert.equal(Validate.getTileMatrixSet('3857')?.identifier, GoogleTms.identifier);
    assert.equal(Validate.getTileMatrixSet('2193')?.identifier, Nztm2000Tms.identifier);
  });

  it('should lookup by identifier', () => {
    assert.equal(Validate.getTileMatrixSet('WebMercatorQuad')?.identifier, GoogleTms.identifier);
    assert.equal(Validate.getTileMatrixSet('NZTM2000Quad')?.identifier, Nztm2000QuadTms.identifier);
    assert.equal(Validate.getTileMatrixSet('Nztm2000')?.identifier, Nztm2000Tms.identifier);
  });

  it('should be case sensitive', () => {
    assert.equal(Validate.getTileMatrixSet('Nztm2000Quad')?.identifier, undefined);
  });
});
