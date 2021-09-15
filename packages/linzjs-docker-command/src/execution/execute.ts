import { CommandExecution } from '../command.execution.js';
import { CommandExecutionResult } from './execute.result.js';

export interface Executor {
    run(cmd: CommandExecution): Promise<CommandExecutionResult>;
}
