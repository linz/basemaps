import { queryStringExtractor } from '../query';

describe('QueryString', () => {
    it('should return foo on "default key in ?api=foo"', () => {
        expect(queryStringExtractor('?api=foo')).toBe('foo');
    });
    it('should return foo on "val of api in ?api=foo"', () => {
        expect(queryStringExtractor('?api=foo', 'api')).toBe('foo');
    });
    it('should return foo on "val of key1 in ?key1=foo&key2=bar"', () => {
        expect(queryStringExtractor('?key1=foo&key2=bar', 'key1')).toBe('foo');
    });
    it('should return bar on "val of key2 in ?key1=foo&key2=bar"', () => {
        expect(queryStringExtractor('?key1=foo&key2=bar', 'key2')).toBe('bar');
    });
    it('should return null on "val of key3 in ?key1=foo&key2=bar"', () => {
        expect(queryStringExtractor('?key1=foo&key2=bar', 'key3')).toBe(null);
    });
    it('should return null on invalid "val of abc in ?abc=foo&def=bar"', () => {
        expect(queryStringExtractor('?abc=foo&def=bar', 'abc')).toBe(null);
    });
});
