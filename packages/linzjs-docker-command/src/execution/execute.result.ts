import { CommandExecution } from '../command.execution.js';

export class CommandExecutionResult {
  stdout: string;
  stderr: string;
  command: CommandExecution;
  exitCode: number;
  duration: number;

  constructor(command: CommandExecution, exitCode: number, stdout: string, stderr: string, duration: number) {
    this.command = command;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;
    this.duration = duration;
  }
}
