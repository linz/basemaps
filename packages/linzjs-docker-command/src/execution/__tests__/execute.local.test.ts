import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Command } from '../../command.js';

/** Block the event loop so the child processes exit before their stdout is read */
function blockEventLoop(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait
  }
}

describe('LocalExecution', () => {
  it('should run hello world', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    assert.equal(cmd.toCommand(), `echo hello world`);
  });

  it('should capture all stdout when the event loop is busy', async () => {
    const expected = JSON.stringify({ layers: [{ name: 'water_polygons' }] });
    const printf = new Command('printf');

    for (let i = 0; i < 3; i++) {  // The first batch is not always affected, so run a few
      const runs = Array.from({ length: 20 }, () => printf.create().arg('%s', expected).run());
      blockEventLoop(100);

      for (const res of await Promise.all(runs)) {
        assert.equal(res.exitCode, 0);
        assert.equal(res.stdout, expected);
      }
    }
  });

  it('should reject when the executable does not exist', async () => {
    await assert.rejects(Command.create('basemaps-command-does-not-exist').run(), { code: 'ENOENT' });
  });
});
