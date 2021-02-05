import { CommandExecution } from '../command.execution';
import { CommandExecutionResult } from './execute.result';

export interface Executor {
    run(cmd: CommandExecution): Promise<CommandExecutionResult>;
}
