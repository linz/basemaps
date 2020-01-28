import { Env, FileOperator, LogType } from '@basemaps/shared';
import * as os from 'os';
import * as path from 'path';
import { GdalCommand } from './gdal.command';

const DOCKER_CONTAINER = Env.get(Env.Gdal.DockerContainer, 'osgeo/gdal');
const DOCKER_CONTAINER_TAG = Env.get(Env.Gdal.DockerContainerTag, 'ubuntu-small-latest');

export class GdalDocker extends GdalCommand {
    mounts: string[];

    constructor() {
        super();
        this.mounts = [];
    }

    mount = (filePath: string): void => {
        if (FileOperator.isS3(filePath)) {
            return;
        }
        const basePath = path.dirname(filePath);
        if (this.mounts.includes(basePath)) {
            return;
        }
        this.mounts.push(basePath);
    };

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

    private async getCredentials(): Promise<string[]> {
        if (this.credentials == null) {
            return [];
        }
        if (this.credentials.needsRefresh()) {
            await this.credentials.refreshPromise();
        }
        return [
            '--env',
            `AWS_ACCESS_KEY_ID=${this.credentials.accessKeyId}`,
            '--env',
            `AWS_SECRET_ACCESS_KEY=${this.credentials.secretAccessKey}`,
            '--env',
            `AWS_SESSION_TOKEN=${this.credentials.sessionToken}`,
        ];
    }

    /** this could contain sensitive info like AWS access keys */
    private async getDockerArgs(): Promise<string[]> {
        const userInfo = os.userInfo();
        const credentials = await this.getCredentials();
        return [
            'run',
            // Config the container to be run as the current user
            '--user',
            `${userInfo.uid}:${userInfo.gid}`,

            ...this.getMounts(),
            ...credentials,

            // Docker container
            '-i',
            `${DOCKER_CONTAINER}:${DOCKER_CONTAINER_TAG}`,
        ];
    }

    /** Provide redacted argument string for logging which removes sensitive information */
    maskArgs(args: string[]): string {
        const argsStr = args.join(' ');
        if (this.credentials) {
            return argsStr
                .replace(this.credentials.secretAccessKey, '****')
                .replace(this.credentials.sessionToken, '****');
        }
        return argsStr;
    }

    async run(cmd: string, args: string[], log: LogType): Promise<void> {
        const dockerArgs = await this.getDockerArgs();
        log.info({ mounts: this.mounts, docker: this.maskArgs(dockerArgs) }, 'SpawnDocker');

        return super.run('docker', [...dockerArgs, cmd, ...args], log);
    }
}
