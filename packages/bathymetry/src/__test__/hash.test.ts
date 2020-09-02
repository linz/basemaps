import o from 'ospec';
import { resolve } from 'path';
import { Hash } from '../hash';

o.spec('hash', () => {
    o('hash', async () => {
        const ans = await Hash.hash(resolve(__dirname.replace('/build/', '/src/'), 'test-file.txt'));
        o(ans).equals('122076427149ca45100f317f16821ef934885cc49352447ee64c9f5e9655c95c695e');
    });
});
