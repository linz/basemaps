/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Metrics } from '../metrics';

describe('Metrics', () => {
    it('should give a empty object if no metrics were recorded', () => {
        const metrics = new Metrics();
        expect(metrics.metrics).toEqual(undefined);
    });

    it('should throw if start/end missmatach', () => {
        const metrics = new Metrics();
        metrics.start('foo');

        expect(metrics.unfinished).toEqual(['foo']);
    });
});
