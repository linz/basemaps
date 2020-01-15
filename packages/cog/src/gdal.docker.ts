import { LogType, Env } from '@basemaps/shared';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { GdalProgressParser } from './gdal.progress';
import { FileOperator } from './file/file';

const DOCKER_CONTAINER = Env.get(Env.Gdal.DockerContainer, 'osgeo/gdal');
const DOCKER_CONTAINER_TAG = Env.get(Env.Gdal.DockerContainerTag, 'ubuntu-small-latest');

export class GdalDocker {
    promise: Promise<void> | null;
    startTime: number;
    mounts: string[];
    child: ChildProcessWithoutNullStreams;
    parser: GdalProgressParser;

    constructor() {
        this.mounts = [];
        this.parser = new GdalProgressParser();
    }

    mount(filePath: string): void {
        if (FileOperator.isS3(filePath)) {
            return;
        }
        const basePath = path.dirname(filePath);
        if (this.mounts.includes(basePath)) {
            return;
        }
        this.mounts.push(basePath);
    }

    private getMounts(): string[] {
        if (this.mounts.length == 0) {
            return [];
        }
        const output: string[] = [];
        for (const mount of this.mounts) {
            output.push('-v');
            output.push(`${mount}:${mount}`);
        }
        return output;
    }

    getDockerArgs(): string[] {
        const userInfo = os.userInfo();

        return [
            'run',
            // Config the container to be run as the current user
            '--user',
            `${userInfo.uid}:${userInfo.gid}`,

            ...this.getMounts(),

            // Docker container
            '-i',
            `${DOCKER_CONTAINER}:${DOCKER_CONTAINER_TAG}`,
        ];
    }

    run(args: string[], log: LogType): Promise<void> {
        if (this.promise != null) {
            return this.promise;
        }
        this.parser.reset();
        this.startTime = Date.now();
        log.info({ mounts: this.mounts, docker: this.getDockerArgs().join(' ') }, 'SpawnDocker');

        const child = spawn('docker', [...this.getDockerArgs(), ...args]);
        this.child = child;

        const errorBuff: Buffer[] = [];
        child.stderr.on('data', (data: Buffer) => errorBuff.push(data));
        child.stdout.on('data', (data: Buffer) => this.parser.data(data));

        this.promise = new Promise((resolve, reject) => {
            child.on('exit', (code: number) => {
                if (code != 0) {
                    log.error({ code, log: errorBuff.join('').trim() }, 'FailedToConvert');
                    return reject(new Error('Failed to execute GDAL: ' + errorBuff.join('').trim()));
                }
                if (errorBuff.length > 0) {
                    log.warn({ log: errorBuff.join('').trim() }, 'CogWarnings');
                }
                this.promise = null;
                return resolve();
            });
            child.on('error', (error: Error) => {
                log.error({ error, log: errorBuff.join('').trim() }, 'FailedToConvert');
                this.promise = null;
                reject(error);
            });
        });

        return this.promise;
    }
}
