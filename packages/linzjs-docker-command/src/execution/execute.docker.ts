import { Command } from '../command.js';
import { CommandExecution } from '../command.execution.js';
import { Executor } from './execute.js';
import { ExecutorLocal } from './execute.local.js';
import { CommandExecutionResult } from './execute.result.js';

export const ExecutorDockerDefaultArgs = [
  // Remove container after running
  '--rm',
];

export function toDockerExecution(cmd: CommandExecution): CommandExecution {
  const proc = Command.Docker.create();
  const containerName = cmd.cmd.containerName;
  if (containerName == null) throw new Error(`Failed to execute command: ${cmd.cmd.executable} as it has no container`);

  proc.args.push('run');
  proc.args.push(...ExecutorDockerDefaultArgs);

  for (const path of cmd.paths) proc.args.push('--volume', `${path}:${path}`);
  for (const [key, value] of cmd.envs.entries()) {
    if (value == null) proc.args.push('--env', key);
    else proc.args.push('--env', `${key}=${value}`);
  }

  proc.args.push(containerName);
  proc.args.push(cmd.cmd.executable);
  proc.args.push(...cmd.args);
  return proc;
}

export const ExecutorDocker: Executor = {
  run(cmd: CommandExecution): Promise<CommandExecutionResult> {
    return ExecutorLocal.run(toDockerExecution(cmd));
  },
};
