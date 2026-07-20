import { CommandExecution, CommandExecutionOptions } from './command.execution.js';

export interface CommandOptions {
  /**
   * Container to use
   * @example "ghcr.io/linz/basemaps/cli"
   */
  container?: string;
  /**
   * Container tag to use
   * @example "v7.0.3"
   */
  tag?: string;

  /** Should the container be used by default */
  useDocker?: boolean;
}
export class Command {
  executable: string;

  container?: string;
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
    return new Command(cmd, opts).create({ useDocker: opts?.useDocker });
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
