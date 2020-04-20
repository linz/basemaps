import { LogType } from '@basemaps/lambda-shared';
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
        const errBuff: Buffer[] = [];
        child.stderr.on('data', (data: Buffer) => {
            const buf = data.toString();
            /**
             * Example error line
             * `ERROR 1: TIFFReadEncodedTile:Read error at row 4294967295, col 4294967295; got 49005 bytes, expected 49152`
             */
            if (buf.includes('ERROR 1')) {
                log.error({ data: buf }, 'GdalError');
            } else {
                log.warn({ data: buf }, 'GdalWarn');
            }
            errBuff.push(data);
        });
        child.stdout.on('data', (data: Buffer) => {
            outputBuff.push(data);
            this.parser.data(data);
        });

        this.promise = new Promise((resolve, reject) => {
            child.on('exit', (code: number) => {
                const stdout = outputBuff.join('').trim();
                const stderr = errBuff.join('').trim();

                if (code != 0) {
                    log.error({ code, stdout, stderr }, 'FailedToConvert');
                    return reject(new Error('Failed to execute GDAL command'));
                }
                log.warn({ stdout, stderr }, 'CogWarnings');

                this.promise = undefined;
                return resolve();
            });
            child.on('error', (error: Error) => {
                const stdout = outputBuff.join('').trim();
                const stderr = errBuff.join('').trim();
                log.error({ stdout, stderr }, 'FailedToConvert');
                this.promise = undefined;
                reject(error);
            });
        });

        return this.promise;
    }
}
