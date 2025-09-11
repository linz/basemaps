import { sha256base58 } from '@basemaps/config';
import { LogType, urlToString } from '@basemaps/shared';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { dirname } from 'path';

export interface GdalCommand {
  /** Output file location */
  output: URL;
  /** GDAL command to use */
  command: 'gdal_create' | 'gdalwarp' | 'gdalbuildvrt' | 'gdal_translate' | 'ogr2ogr';
  /** GDAL arguments to use */
  args: string[];
}

function getDockerContainer(): string {
  const containerPath = process.env['GDAL_DOCKER_CONTAINER'] ?? 'ghcr.io/osgeo/gdal';
  const tag = process.env['GDAL_DOCKER_CONTAINER_TAG'] ?? 'ubuntu-small-3.11.3';
  return `${containerPath}:${tag}`;
}

/** Convert a GDAL command to run using docker */
function toDockerArgs(cmd: GdalCommand): string[] {
  const dirName = dirname(urlToString(cmd.output));

  const args = ['run'];
  if (cmd.output) args.push(...['-v', `${dirName}:${dirName}`]);
  args.push(...[getDockerContainer(), cmd.command, ...cmd.args]);
  return args;
}

export class GdalRunner {
  parser: GdalProgressParser = new GdalProgressParser();
  startTime!: number;
  cmd: GdalCommand;

  constructor(cmd: GdalCommand) {
    this.cmd = cmd;
  }

  /**
   * Run a GDAL command
   *
   * @param logger logger to use
   */
  async run(logger?: LogType): Promise<{ stdout: string; stderr: string; duration: number }> {
    const commandHash = sha256base58(JSON.stringify(this.cmd)); // Hash the arguments as the arguments can be way too big to log
    logger?.debug({ command: this.cmd.command, gdalArgs: this.cmd.args, hash: commandHash }, 'Gdal:Command');
    logger?.info({ command: this.cmd.command, commandHash }, 'Gdal:Start');

    const cmd = this.cmd.command;

    this.parser.reset();

    let lastTime = performance.now();
    this.parser.on('progress', (progress) => {
      const duration = performance.now() - lastTime;
      lastTime = performance.now();
      logger?.debug(
        {
          cmd: this.cmd.command,
          output: this.cmd.output,
          commandHash,
          duration: Number(duration.toFixed(3)),
          progress: Number(progress.toFixed(3)),
        },
        'Gdal:Progress',
      );
    });
    this.startTime = performance.now();

    const useDocker = !!process.env['GDAL_DOCKER'];
    if (useDocker) {
      logger?.info({ command: this.cmd.command, commandHash, container: getDockerContainer() }, 'Gdal:Docker');
    }

    const child = useDocker ? spawn('docker', toDockerArgs(this.cmd)) : spawn(this.cmd.command, this.cmd.args);

    const outputBuff: Buffer[] = [];
    const errBuff: Buffer[] = [];
    child.stderr.on('data', (data: Buffer) => {
      const buf = data.toString();
      /**
       * Example error line
       *
       * `ERROR 1: TIFFReadEncodedTile:Read error at row 4294967295, col 4294967295; got 49005 bytes, expected 49152`
       */
      if (buf.includes('ERROR 1')) {
        logger?.error({ cmd, data: buf.toString().trim() }, 'Gdal:Error');
      } else {
        logger?.warn({ cmd, data: buf.toString().trim() }, 'Gdal:Warn');
      }
      errBuff.push(data);
    });

    child.stdout.on('data', (data: Buffer) => {
      outputBuff.push(data);
      this.parser.data(data);
    });

    return new Promise<{ stdout: string; stderr: string; duration: number }>((resolve, reject) => {
      child.on('exit', (code: number) => {
        const stdout = outputBuff.join('').trim();
        const stderr = errBuff.join('').trim();
        const duration = performance.now() - this.startTime;

        if (code !== 0) {
          logger?.error({ cmd, args: this.cmd.args, code, stdout, stderr, duration }, 'Gdal:Failed');
          return reject(new Error('Failed to execute GDAL command: ' + cmd));
        }
        logger?.debug({ cmd, commandHash, duration }, 'Gdal:Done');
        return resolve({ stdout, stderr, duration });
      });

      child.on('error', (error: Error) => {
        const stdout = outputBuff.join('').trim();
        const stderr = errBuff.join('').trim();
        const duration = Date.now() - this.startTime;

        logger?.error({ stdout, stderr, duration }, 'Gdal:Failed');
        reject(error);
      });
    });
  }
}

/**
 * Emit a "progress" event every time a "." is recorded in the output
 */
export class GdalProgressParser extends EventEmitter<{ progress: [number] }> {
  // Progress starts with "Input file size is .., ..\n"
  waitNewLine = true;
  dotCount = 0;
  byteCount = 0;
  // Last time a progress event was emitted
  lastEmit = -1;
  // debounce emits to every 1 second
  debounceMs = 1000;

  /** Reset the progress counter */
  reset(): void {
    this.waitNewLine = true;
    this.dotCount = 0;
    this.byteCount = 0;
  }

  get progress(): number {
    return this.dotCount * (100 / 31);
  }

  data(data: Buffer): void {
    const str = data.toString('utf8');
    this.byteCount += str.length;
    // In theory only a small amount of output bytes should be recorded
    if (this.byteCount > 4096) throw new Error('Too much data: ' + str);
    if (str === '0') {
      this.waitNewLine = false;
      return;
    }

    if (this.waitNewLine) {
      const newLine = str.indexOf('\n');
      if (newLine > -1) {
        this.waitNewLine = false;
        return this.data(Buffer.from(str.slice(newLine + 1)));
      }
      return;
    }

    for (const char of str) {
      if (char !== '.') continue;
      this.dotCount++;
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastEmit;
      if (timeDiff > this.debounceMs || this.progress === 100) {
        this.lastEmit = currentTime;
        this.emit('progress', this.progress);
      }
    }
  }
}
