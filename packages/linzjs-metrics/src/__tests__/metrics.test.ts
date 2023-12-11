import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Metrics } from '../metrics.js';

describe('Metrics', () => {
  it('should give a empty object if no metrics were recorded', () => {
    const metrics = new Metrics();
    assert.equal(metrics.metrics, undefined);
  });

  it('should throw if start/end mismatch', () => {
    const metrics = new Metrics();
    metrics.start('foo');
    assert.deepEqual(metrics.unfinished, ['foo']);
  });

  it('should throw on duplicate start', () => {
    const metrics = new Metrics();
    metrics.start('foo');
    assert.throws(() => metrics.start('foo'), Error);
  });

  it('should not throw on reusing timers', () => {
    const metrics = new Metrics();
    metrics.start('foo');
    assert.deepEqual(metrics.unfinished, ['foo']);
    metrics.end('foo');
    assert.equal(metrics.unfinished, undefined);

    metrics.start('foo');
    assert.deepEqual(metrics.unfinished, ['foo']);
    metrics.end('foo');
    assert.equal(metrics.unfinished, undefined);
  });

  it('should throw an Error if end before start', () => {
    const metrics = new Metrics();
    assert.throws(() => metrics.end('bar'), Error);
  });

  it('should return two unfinished entries', () => {
    const metrics = new Metrics();
    metrics.start('foo');
    metrics.start('bar');
    assert.deepEqual(metrics.unfinished, ['foo', 'bar']);
  });

  it('should return empty unfinished metric list using start/end', () => {
    const metrics = new Metrics();
    metrics.start('foo');
    metrics.end('foo');
    assert.equal(metrics.unfinished, undefined);
  });
});
