import { Env } from '../const';

describe('Environment', () => {
    it('should load a number from environment var', () => {
        process.env[Env.TiffConcurrency] = '5';
        expect(Env.getNumber(Env.TiffConcurrency, -1)).toEqual(5);
    });

    it('should default from environment var', () => {
        delete process.env[Env.TiffConcurrency];
        expect(Env.getNumber(Env.TiffConcurrency, -1)).toEqual(-1);
        expect(Env.get(Env.TiffConcurrency, 'foo')).toEqual('foo');
    });
});
