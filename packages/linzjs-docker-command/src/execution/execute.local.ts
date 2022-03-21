import { spawn } from 'child_process';
import { CommandExecution } from '../command.execution.js';
import { Executor } from './execute.js';
import { CommandExecutionResult } from './execute.result.js';

export const ExecutorLocal: Executor = {
  run(cmd: CommandExecution): Promise<CommandExecutionResult> {
    const startTime = Date.now();
    const child = spawn(cmd.cmd.executable, cmd.args);

    const stdout: string[] = [];
    const stderr: string[] = [];

    child.stdout.on('data', (chunk: string) => stdout.push(chunk));
    child.stderr.on('data', (chunk: string) => stderr.push(chunk));

    return new Promise((resolve) => {
      child.on('exit', (exitCode: number) => {
        resolve(new CommandExecutionResult(cmd, exitCode, stdout.join(''), stderr.join(''), Date.now() - startTime));
      });
    });
  },
};
