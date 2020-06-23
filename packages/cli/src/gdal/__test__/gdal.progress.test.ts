import { GdalProgressParser } from '../gdal.progress';
import o from 'ospec';

o.spec('GdalProgressParser', () => {
    o('should emit on progress', () => {
        const prog = new GdalProgressParser();
        o(prog.progress).equals(0);

        prog.data(Buffer.from('\n.'));
        o(prog.progress.toFixed(2)).equals('3.23');
    });

    o('should take 31 dots to finish', () => {
        const prog = new GdalProgressParser();
        let processCount = 0;
        prog.data(Buffer.from('\n'));
        prog.on('progress', () => processCount++);

        for (let i = 0; i < 31; i++) {
            prog.data(Buffer.from('.'));
            o(processCount).equals(i + 1);
        }
        o(prog.progress.toFixed(2)).equals('100.00');
    });
});
