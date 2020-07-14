import { LogConfig, Env } from '@basemaps/shared';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { BathyMaker } from './bathy.maker';
import { PrettyTransform } from 'pretty-json-log';
import { CliId } from '@basemaps/cli/build/cli/base.cli';
import * as fs from 'fs';

if (process.stdout.isTTY) LogConfig.setOutputStream(PrettyTransform.stream());
const Logger = LogConfig.get().child({ id: CliId });
Logger.level = 'debug';

const Usage = '\n./make-bathy <bathy-file> [-v] [--docker]';
// TODO we should move this to use the same CLI strucutre we use in @basemaps/cli
async function main(): Promise<void> {
    const isVerbose = process.argv.includes('-v');
    const isDocker = process.argv.includes('--docker');
    const pathToFile = process.argv.find((f) => f.startsWith('/') && (f.endsWith('.tiff') || f.endsWith('.nc')));

    if (pathToFile == null || !fs.existsSync(pathToFile)) {
        console.log('Cannot find tiff\n' + Usage);
        process.exit(1);
    }

    if (isDocker) process.env[Env.Gdal.UseDocker] = 'true';
    if (isVerbose) Logger.level = 'trace';

    Logger.info({ source: pathToFile }, 'MakeBathy');

    const bathy = new BathyMaker({ path: pathToFile, tms: GoogleTms, zoom: 4, threads: 8 });
    await bathy.render(Logger);
}

main().catch(console.error);
