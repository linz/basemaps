import { GdalCommand } from './gdal.command';

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
}
