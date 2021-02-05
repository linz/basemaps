import { Command } from './command';
import { ExecutorDocker } from './execution/execute.docker';
import { ExecutorLocal } from './execution/execute.local';
import { CommandExecutionResult } from './execution/execute.result';

export interface CommandExecutionOptions {
    useDocker: boolean;
}

export class CommandExecution {
    cmd: Command;
    paths: Set<string> = new Set();
    envs: Map<string, string | null> = new Map();
    args: string[] = [];
    useDocker?: boolean;
    constructor(cmd: Command, opts?: CommandExecutionOptions) {
        this.cmd = cmd;
        if (opts) {
            this.useDocker = opts.useDocker;
        }
    }

    get isRunWithDocker(): boolean {
        if (this.useDocker == null) return this.cmd.useDocker;
        return this.useDocker;
    }

    /** Mount a folder, useful only if the command is run inside of docker */
    mount(...paths: string[]): CommandExecution {
        for (const p of paths) {
            if (!p.startsWith('/')) throw new Error(`Docker mount paths must be absolute, got:"${p}"`);
            this.paths.add(p);
        }
        return this;
    }

    arg(value: string): CommandExecution;
    arg(key: string, value: string): CommandExecution;
    arg(key: string, value?: string): CommandExecution {
        this.args.push(key);
        if (value) this.args.push(value);
        return this;
    }

    /** Add an environment variable to the container execution */
    env(value: string): CommandExecution;
    env(key: string, value: string): CommandExecution;
    env(key: string, value?: string): CommandExecution {
        if (value == null) this.envs.set(key, null);
        else this.envs.set(key, value);
        return this;
    }

    /** Execute the command */
    run(): Promise<CommandExecutionResult> {
        if (this.isRunWithDocker) return ExecutorDocker.run(this);
        return ExecutorLocal.run(this);
    }

    /** Generate a command line command to run */
    toCommand(): string {
        return `${this.cmd.executable} ${this.args.join(' ')}`;
    }
}
