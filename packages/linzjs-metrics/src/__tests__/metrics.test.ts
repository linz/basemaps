import { Metrics } from '../metrics';
import o from 'ospec';

o.spec('Metrics', () => {
    o('should give a empty object if no metrics were recorded', () => {
        const metrics = new Metrics();
        o(metrics.metrics).equals(undefined);
    });

    o('should throw if start/end mismatch', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        o(metrics.unfinished).deepEquals(['foo']);
    });

    o('should throw an Error if end before start', () => {
        const metrics = new Metrics();
        o(function () {
            metrics.end('bar');
        }).throws(Error);
    });

    o('should return two unfinished entries', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        metrics.start('bar');
        o(metrics.unfinished).deepEquals(['foo', 'bar']);
    });

    o('should return empty unfinished metric list using start/end', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        metrics.end('foo');
        o(metrics.unfinished).equals(undefined);
    });
});
