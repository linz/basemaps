import { truncateApiKey } from '../api.truncate.js';
import o from 'ospec';

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

  o('should truncate truncated', () => {
    o(truncateApiKey('cbda80e')).equals('cbda80e');
    o(truncateApiKey('dbda80e')).equals('dbda80e');
  });
});
