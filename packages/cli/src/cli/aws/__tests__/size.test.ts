import o from 'ospec';
import { parseSize } from '../sizes.js';

o.spec('parseSize', () => {
  o('should parse bytes', () => {
    o(parseSize('1')).equals(1);
    o(parseSize('1KB')).equals(1024);
    o(parseSize('1MB')).equals(1024 * 1024);
    o(parseSize('1GB')).equals(1024 * 1024 * 1024);
    o(parseSize('1TB')).equals(1024 * 1024 * 1024 * 1024);
  });

  o('should parse negative bytes', () => {
    o(parseSize('-1.2 ')).equals(-1);
    o(parseSize('-1.2 KB')).equals(Math.round(-1.2 * 1024));
    o(parseSize('-1.2 MB')).equals(Math.round(-1.2 * 1024 * 1024));
    o(parseSize('-1.2 GB')).equals(Math.round(-1.2 * 1024 * 1024 * 1024));
    o(parseSize('-1.2 TB')).equals(Math.round(-1.2 * 1024 * 1024 * 1024 * 1024));
  });

  o('should parse partial bytes', () => {
    o(parseSize('1.2 ')).equals(1);
    o(parseSize('1.2 KB')).equals(Math.round(1.2 * 1024));
    o(parseSize('1.2 MB')).equals(Math.round(1.2 * 1024 * 1024));
    o(parseSize('1.2 GB')).equals(Math.round(1.2 * 1024 * 1024 * 1024));
    o(parseSize('1.2 TB')).equals(Math.round(1.2 * 1024 * 1024 * 1024 * 1024));
  });

  o('should parse metric', () => {
    o(parseSize('1Ki')).equals(1000);
    o(parseSize('1Mi')).equals(1000 * 1000);
    o(parseSize('1Gi')).equals(1000 * 1000 * 1000);
    o(parseSize('1Ti')).equals(1000 * 1000 * 1000 * 1000);
  });

  o('should parse partial metric', () => {
    o(parseSize('1.2 Ki')).equals(1.2 * 1000);
    o(parseSize('1.2 Mi')).equals(1.2 * 1000 * 1000);
    o(parseSize('1.2 Gi')).equals(1.2 * 1000 * 1000 * 1000);
    o(parseSize('1.2 Ti')).equals(1.2 * 1000 * 1000 * 1000 * 1000);
  });
  o('should parse negative metric', () => {
    o(parseSize('-1.2 ')).equals(-1);
    o(parseSize('-1.2 Ki')).equals(-1.2 * 1000);
    o(parseSize('-1.2 Mi')).equals(-1.2 * 1000 * 1000);
    o(parseSize('-1.2 Gi')).equals(-1.2 * 1000 * 1000 * 1000);
    o(parseSize('-1.2 Ti')).equals(-1.2 * 1000 * 1000 * 1000 * 1000);
  });

  o('should fail on invalid test', () => {
    o(() => parseSize('1 B B')).throws(Error);
    o(() => parseSize('1 ZB')).throws(Error);
    o(() => parseSize('1 Zi')).throws(Error);
    o(() => parseSize('a')).throws(Error);
  });
});
