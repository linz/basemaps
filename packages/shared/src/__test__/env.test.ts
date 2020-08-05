import { Env } from '../const';
import o from 'ospec';

o.spec('Environment', () => {
    o('should load a number from environment var', () => {
        process.env[Env.TiffConcurrency] = '5';
        o(Env.getNumber(Env.TiffConcurrency, -1)).equals(5);
    });

    o('should default from environment var', () => {
        delete process.env[Env.TiffConcurrency];
        o(Env.getNumber(Env.TiffConcurrency, -1)).equals(-1);
    });
});
