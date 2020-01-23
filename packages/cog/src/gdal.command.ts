import { LogType } from '@basemaps/shared';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { GdalProgressParser } from './gdal.progress';

export abstract class GdalCommand {
    parser: GdalProgressParser;
    protected child: ChildProcessWithoutNullStreams;
    protected promise?: Promise<void>;
    protected startTime: number;

    /** AWS Access  */
    protected credentials?: AWS.Credentials;

    constructor() {
        this.parser = new GdalProgressParser();
    }

    mount?: (mount: string) => void;
    env?: () => Promise<Record<string, string | undefined>>;

    /** Pass AWS credentials into the container */
    setCredentials(credentials?: AWS.Credentials): void {
        this.credentials = credentials;
    }

    async run(cmd: string, args: string[], log: LogType): Promise<void> {
        if (this.promise != null) {
            return this.promise;
        }
        this.parser.reset();
        this.startTime = Date.now();

        const env = this.env ? await this.env() : process.env;
        const child = spawn(cmd, args, { env });
        this.child = child;

        const outputBuff: Buffer[] = [];
        child.stderr.on('data', (data: Buffer) => log.warn({ data: data.toString() }, 'GdalWarn'));
        child.stdout.on('data', (data: Buffer) => {
            outputBuff.push(data);
            this.parser.data(data);
        });

        this.promise = new Promise((resolve, reject) => {
            child.on('exit', (code: number) => {
                const output = outputBuff.join('').trim();
                if (code != 0) {
                    log.error({ code, output }, 'FailedToConvert');
                    return reject(new Error('Failed to execute GDAL: ' + output));
                }
                log.warn({ output }, 'CogWarnings');

                delete this.promise;
                return resolve();
            });
            child.on('error', (error: Error) => {
                log.error({ error, output: outputBuff.join('').trim() }, 'FailedToConvert');
                delete this.promise;
                reject(error);
            });
        });

        return this.promise;
    }
}
