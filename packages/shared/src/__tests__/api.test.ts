import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { decodeTime, encodeTime, ulid } from 'ulid';

import { getApiKey, isValidApiKey, OneDayMs, truncateApiKey } from '../api.js';

declare const global: {
  localStorage?: { getItem: (a: string) => string | null; setItem: (k: string, v: string) => void };
};

describe('ApiKey', () => {
  const localStorage = { getItem: (): string | null => null, setItem: (): void => undefined };
  beforeEach(() => {
    localStorage.getItem = (): string | null => null;
    localStorage.setItem = (): void => undefined;
    global.localStorage = localStorage;
  });
  afterEach(() => {
    delete global.localStorage;
  });
  it('should generate a ulid with prefix', () => {
    const apiKey = getApiKey();
    assert.equal(apiKey.startsWith('c'), true);
    const ulidKey = apiKey.slice(1).toUpperCase();
    assert.equal(decodeTime(ulidKey) > 0, true);
  });
  it('should get valid api keys from localStorage', (t) => {
    let currentValue = 'foo';
    t.mock.method(localStorage, 'getItem', () => currentValue);
    assert.notEqual(getApiKey(), 'foo');

    currentValue = '01ebpv4fgbxqnff6kdc184bx0j';
    assert.notEqual(getApiKey(), '01ebpv4fgbxqnff6kdc184bx0j');

    const newKey = 'c' + ulid().toLowerCase();
    currentValue = newKey;
    assert.equal(getApiKey(), newKey);
  });

  it('should allow api keys that are very old', () => {
    const fakeUlid = 'c' + encodeTime(new Date('2020-01-01T00:00:00.000Z').getTime(), 10) + ulid().slice(10);
    assert.deepEqual(isValidApiKey(fakeUlid), { valid: true, key: fakeUlid });
  });

  it('should generate new keys after they expire', (t) => {
    const setSpy = t.mock.method(localStorage, 'setItem');
    // Generate a key that is about 31 days old
    const oldDate = Date.now() - OneDayMs * 31;
    const fakeUlid = 'c' + encodeTime(oldDate, 10) + ulid().slice(10);
    t.mock.method(localStorage, 'getItem', () => fakeUlid.toLowerCase());

    // the fake ulid should be able to be decoded too
    const time = decodeTime(fakeUlid.slice(1).toUpperCase());
    assert.equal(time - oldDate < 1000, true);

    const newApiKey = getApiKey();
    assert.deepEqual(setSpy.mock.calls[0].arguments, ['api-key', newApiKey]);
    assert.notEqual(newApiKey, fakeUlid.toLocaleLowerCase());
    // new key should be made recently (within 1second)
    assert.equal(Date.now() - decodeTime(newApiKey.slice(1).toUpperCase()) < 1000, true);
  });
});

describe('ApiKeyTruncate', () => {
  it('should truncate apikeys', () => {
    assert.equal(truncateApiKey('c01h3e17kjsw5evq8ndjxbda80e'), 'cbda80e');
    assert.equal(truncateApiKey('d01h3e17kjsw5evq8ndjxbda80e'), 'dbda80e');
  });

  it('should not truncate invalid api keys', () => {
    assert.deepEqual(truncateApiKey([{ hello: 'world' }]), 'invalid');
    assert.equal(truncateApiKey(null), 'invalid');
    assert.equal(truncateApiKey(1), 'invalid');
  });

  it('should not truncate truncated', () => {
    assert.equal(truncateApiKey('cbda80e'), 'cbda80e');
    assert.equal(truncateApiKey('dbda80e'), 'dbda80e');
  });
});
