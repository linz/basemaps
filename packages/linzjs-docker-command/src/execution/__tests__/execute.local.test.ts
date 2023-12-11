import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Command } from '../../command.js';

describe('LocalExecution', () => {
  it('should run hello world', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    assert.equal(cmd.toCommand(), `echo hello world`);
  });
});
