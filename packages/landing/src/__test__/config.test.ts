import o from 'ospec';
import { Config } from '../config';

o.spec('Config', () => {
    o('should return the same api key', () => {
        const keyA = Config.ApiKey;
        o(keyA).equals(Config.ApiKey);
    });
});
