import { Env, LogType } from '@basemaps/shared';
import { GdalCommand } from './gdal.command';
import { GdalDocker } from './gdal.docker';
import { GdalLocal } from './gdal.local';

export class Gdal {
    /**
     * Create a new GdalCommand instance ready to run commands
     *
     * This could be a local or docker container depending on environment variables
     * @see Env.Gdal.UseDocker
     */
    static create(): GdalCommand {
        if (Env.get(Env.Gdal.UseDocker)) return new GdalDocker();
        return new GdalLocal();
    }

    /**
     * Run a `gdal_translate --version` to extract the current gdal version
     *
     * @example "GDAL 2.4.2, released 2019/06/28"
     * @example "GDAL 3.2.0dev-69b0c4ec4174fde36c609a4aac6f4281424021b3, released 2020/06/26"
     */
    static async version(logger: LogType): Promise<string> {
        const gdal = Gdal.create();
        const { stdout } = await gdal.run('gdal_translate', ['--version'], logger);
        return stdout;
    }
}
