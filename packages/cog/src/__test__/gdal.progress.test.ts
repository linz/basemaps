import { GdalProgressParser } from '../gdal.progress';

describe('GdalProgressParser', () => {
    it('should emit on progress', () => {
        const prog = new GdalProgressParser();
        expect(prog.progress).toEqual(0);

        prog.data(Buffer.from('\n.'));
        expect(prog.progress.toFixed(2)).toEqual('3.23');
    });

    it('should take 31 dots to finish', () => {
        const prog = new GdalProgressParser();
        let processCount = 0;
        prog.data(Buffer.from('\n'));
        prog.on('progress', () => processCount++);

        for (let i = 0; i < 31; i++) {
            prog.data(Buffer.from('.'));
            expect(processCount).toEqual(i + 1);
        }
        expect(prog.progress.toFixed(2)).toEqual('100.00');
    });
});
