import { queryStringExtractor } from '../index';

describe('QueryString', () => {
    it('should parse ?api=foo', () => {
        expect(queryStringExtractor('?api=foo')).toBe('qs:?api=foo');
    });
});
