import { CommandExecution, CommandExecutionOptions } from './command.execution.js';

export interface CommandOptions {
    container: string;
    tag?: string;
}
export class Command {
    executable: string;

    container: string;
    containerTag?: string;

    useDocker = true;

    static Docker = new Command('docker');

    constructor(executable: string, opts?: CommandOptions) {
        this.executable = executable;
        if (opts) {
            this.container = opts.container;
            this.containerTag = opts.tag;
        }
        if (this.container == null) this.useDocker = false;
    }

    static create(cmd: string, opts?: CommandOptions): CommandExecution {
        return new Command(cmd, opts).create();
    }

    get containerName(): string {
        if (this.container == null) throw new Error(`No container specified for command "${this.executable}"`);
        if (this.containerTag == null) return this.container;
        return `${this.container}:${this.containerTag}`;
    }

    create(opts?: CommandExecutionOptions): CommandExecution {
        return new CommandExecution(this, opts);
    }
}
