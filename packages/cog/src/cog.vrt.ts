import { CogJob, onProgress } from './cog';
import { LogType, EPSG, Projection } from '@basemaps/shared';
import { FileOperator } from './file/file';
import { GdalDocker } from './gdal.docker';

export interface VrtOptions {
    /** Vrts will add a second alpha layer if one exists, so dont always add one */
    addAlpha: boolean;
    /** No need to force a reprojection to 3857 if source imagery is in 3857 */
    forceEpsg3857: boolean;
}

/**
 * Build a VRT for a collection of tiff files
 *
 * @param job job that is associated
 * @param options additional options for vrt generation
 * @param tmpTarget temp folder to store working files
 * @param logger logger to use
 */
export async function buildVrtForTiffs(
    job: CogJob,
    options: VrtOptions,
    tmpTarget: string,
    logger: LogType,
): Promise<string> {
    const vrtPath = FileOperator.join(tmpTarget, `${job.id}.vrt`);
    const vrtWarpedPath = FileOperator.join(tmpTarget, `${job.id}.${EPSG.Google}.vrt`);

    const vrtExists = await FileOperator.get(vrtPath).exists(vrtPath);
    if (!vrtExists) {
        logger.info({ path: vrtPath }, 'BuildVrt');
        const gdalDocker = new GdalDocker();
        gdalDocker.mount(vrtPath);
        job.source.files.forEach(fileName => gdalDocker.mount(fileName));
        gdalDocker.parser.on('progress', onProgress({ target: 'vrt' }, logger));

        const buildVrtCmd = ['gdalbuildvrt', '-hidenodata'];
        if (options.addAlpha) {
            buildVrtCmd.push('-addalpha');
        }

        await gdalDocker.run([...buildVrtCmd, vrtPath, ...job.source.files], logger);
    }

    if (!options.forceEpsg3857) {
        return vrtPath;
    }

    const vrtWarpedExists = await FileOperator.get(vrtWarpedPath).exists(vrtWarpedPath);
    if (!vrtWarpedExists) {
        logger.info({ path: vrtWarpedPath }, 'BuildVrt:Warped');
        const gdalDocker = new GdalDocker();
        gdalDocker.mount(vrtWarpedPath);
        job.source.files.forEach(fileName => gdalDocker.mount(fileName));
        gdalDocker.parser.on('progress', onProgress({ target: `vrt.${EPSG.Google}` }, logger));

        await gdalDocker.run(
            ['gdalwarp', '-of', 'VRT', '-t_srs', Projection.toEpsgString(EPSG.Google), vrtPath, vrtWarpedPath],
            logger,
        );
    }
    return vrtWarpedPath;
}
