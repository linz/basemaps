/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Metrics } from '../metrics';
import { LambdaSession } from '../session';

describe('Metrics', () => {
    beforeEach(() => {
        LambdaSession.reset();
    });

    it('should give a empty object if no metrics were recorded', () => {
        const metrics = new Metrics();
        expect(metrics.metrics).toEqual(undefined);
    });

    it('should throw if start/end mismatch', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        expect(metrics.unfinished).toEqual(['foo']);
    });

    it('should throw an Error if end before start', () => {
        const metrics = new Metrics();
        expect(function() {
            metrics.end('bar');
        }).toThrow(Error);
    });

    it('should return two unfinished entries', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        metrics.start('bar');
        expect(metrics.unfinished).toEqual(['foo', 'bar']);
    });

    it('should return empty unfinished metric list using start/end', () => {
        const metrics = new Metrics();
        metrics.start('foo');
        metrics.end('foo');
        expect(metrics.unfinished).toEqual(undefined);
    });
});
