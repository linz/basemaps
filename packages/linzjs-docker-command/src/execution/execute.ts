import type { CommandExecution } from '../command.execution.js';
import type { CommandExecutionResult } from './execute.result.js';

export interface Executor {
  run(cmd: CommandExecution): Promise<CommandExecutionResult>;
}
