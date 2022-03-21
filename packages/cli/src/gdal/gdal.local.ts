import { LogType } from '@basemaps/shared';
import { GdalCommand } from './gdal.command.js';

export class GdalLocal extends GdalCommand {
  async env(): Promise<Record<string, string | undefined>> {
    if (this.credentials == null) {
      return process.env;
    }
    if (this.credentials.needsRefresh()) {
      await this.credentials.refreshPromise();
    }
    return {
      ...process.env,
      AWS_ACCESS_KEY_ID: this.credentials.accessKeyId,
      AWS_SECRET_ACCESS_KEY: this.credentials.secretAccessKey,
      AWS_SESSION_TOKEN: this.credentials.sessionToken,
    };
  }

  async run(cmd: string, args: string[], log: LogType): Promise<{ stdout: string; stderr: string }> {
    log.debug({ cmd, gdalArgs: args.slice(0, 50).join(' ') }, 'StartGdal:Local');
    return super.run(cmd, args, log);
  }
}
