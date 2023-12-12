import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Command } from '../../command.js';
import { toDockerExecution } from '../execute.docker.js';

describe('DockerExecution', () => {
  it('should run hello world', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    assert.equal(toDockerExecution(cmd).toCommand(), `docker run --rm ubuntu echo hello world`);
  });

  it('should mount folders', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    cmd.mount('/home');

    assert.equal(toDockerExecution(cmd).toCommand(), `docker run --rm --volume /home:/home ubuntu echo hello world`);
  });

  it('should not mount duplicate folders', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    cmd.mount('/home');
    cmd.mount('/home');
    assert.equal(toDockerExecution(cmd).toCommand(), `docker run --rm --volume /home:/home ubuntu echo hello world`);
  });

  it('should mount env vars', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    cmd.env('AWS_ACCESS_KEY', 'fakeKey');
    assert.equal(
      toDockerExecution(cmd).toCommand(),
      `docker run --rm --env AWS_ACCESS_KEY=fakeKey ubuntu echo hello world`,
    );
  });

  it('should pass through env vars', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    cmd.env('AWS_ACCESS_KEY');
    assert.equal(toDockerExecution(cmd).toCommand(), `docker run --rm --env AWS_ACCESS_KEY ubuntu echo hello world`);
  });
});
