import o from 'ospec';
import { decodeTime, encodeTime, ulid } from 'ulid';
import { getApiKey, OneDayMs, truncateApiKey } from '../api.js';

declare const global: {
  localStorage?: { getItem: (a: string) => string | null; setItem: (k: string, v: string) => void };
};

o.spec('ApiKey', () => {
  const localStorage = { getItem: (): string | null => null, setItem: (): void => undefined };
  o.beforeEach(() => {
    localStorage.getItem = (): string | null => null;
    localStorage.setItem = (): void => undefined;
    global.localStorage = localStorage as any;
  });
  o.afterEach(() => {
    delete global.localStorage;
  });
  o('should generate a ulid with prefix', () => {
    const apiKey = getApiKey();
    o(apiKey.startsWith('c')).equals(true);
    const ulidKey = apiKey.slice(1).toUpperCase();
    o(decodeTime(ulidKey) > 0).equals(true);
  });
  o('should get valid api keys from localStorage', () => {
    localStorage.getItem = o.spy((): string => 'foo');
    o(getApiKey()).notEquals('foo');

    localStorage.getItem = o.spy(() => '01ebpv4fgbxqnff6kdc184bx0j');
    o(getApiKey()).notEquals('01ebpv4fgbxqnff6kdc184bx0j');

    const newKey = 'c' + ulid().toLowerCase();
    localStorage.getItem = o.spy(() => newKey);
    o(getApiKey()).equals(newKey);
  });

  o('should generate new keys after they expire', () => {
    const setSpy = o.spy();
    localStorage.setItem = setSpy;
    // Generate a key that is about 31 days old
    const oldDate = Date.now() - OneDayMs * 31;
    const fakeUlid = 'c' + encodeTime(oldDate, 10) + ulid().slice(10);
    localStorage.getItem = o.spy(() => fakeUlid.toLowerCase());

    // the fake ulid should be able to be decoded too
    const t = decodeTime(fakeUlid.slice(1).toUpperCase());
    o(t - oldDate < 1000).equals(true);

    const newApiKey = getApiKey();
    o(setSpy.args).deepEquals(['api-key', newApiKey]);
    o(newApiKey).notEquals(fakeUlid.toLocaleLowerCase());
    // new key should be made recently (within 1second)
    o(Date.now() - decodeTime(newApiKey.slice(1).toUpperCase()) < 1000).equals(true);
  });
});

o.spec('ApiKeyTruncate', () => {
  o('should truncate apikeys', () => {
    o(truncateApiKey('c01h3e17kjsw5evq8ndjxbda80e')).equals('cbda80e');
    o(truncateApiKey('d01h3e17kjsw5evq8ndjxbda80e')).equals('dbda80e');
  });

  o('should not truncate invalid api keys', () => {
    o(truncateApiKey([{ hello: 'world' }])).deepEquals('invalid');
    o(truncateApiKey(null)).equals('invalid');
    o(truncateApiKey(1)).equals('invalid');
  });

  o('should not truncate truncated', () => {
    o(truncateApiKey('cbda80e')).equals('cbda80e');
    o(truncateApiKey('dbda80e')).equals('dbda80e');
  });
});
