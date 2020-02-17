import { queryStringExtractor } from '../query';
import * as o from 'ospec';

o.spec('QueryString', (): void => {
    o('should return foo on "default key in ?api=foo"', (): void => {
        o(queryStringExtractor('?api=foo')).equals('foo');
    });
    o('should return foo on "val of api in ?api=foo"', (): void => {
        o(queryStringExtractor('?api=foo', 'api')).equals('foo');
    });
    o('should return foo on "val of key1 in ?key1=foo&key2=bar"', (): void => {
        o(queryStringExtractor('?key1=foo&key2=bar', 'key1')).equals('foo');
    });
    o('should return bar on "val of key2 in ?key1=foo&key2=bar"', (): void => {
        o(queryStringExtractor('?key1=foo&key2=bar', 'key2')).equals('bar');
    });
    o('should return null on "val of key3 in ?key1=foo&key2=bar"', (): void => {
        o(queryStringExtractor('?key1=foo&key2=bar', 'key3')).equals(null);
    });
});
