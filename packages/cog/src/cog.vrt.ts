import { Aws, EPSG, LogType, Projection } from '@basemaps/shared';
import { CogJob, onProgress } from './cog';
import { FileOperator } from './file/file';
import { isConfigS3Role } from './file/file.config';
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
 * @param tmpTarget Local temp folder to store working files
 * @param logger logger to use
 */
export async function buildVrtForTiffs(
    job: CogJob,
    options: VrtOptions,
    tmpTarget: string,
    logger: LogType,
): Promise<string> {
    const vrtPath = FileOperator.join(tmpTarget, `${job.id}.vrt`);

    logger.info({ path: vrtPath }, 'BuildVrt');
    const gdalDocker = new GdalDocker();
    gdalDocker.mount(vrtPath);
    gdalDocker.parser.on('progress', onProgress({ target: 'vrt' }, logger));

    const buildVrtCmd = ['gdalbuildvrt', '-hidenodata'];
    if (options.addAlpha) {
        buildVrtCmd.push('-addalpha');
    }

    // If required assume role
    if (isConfigS3Role(job.source)) {
        const credentials = Aws.credentials.getCredentialsForRole(job.source.roleArn, job.source.externalId);
        await gdalDocker.setCredentials(credentials);
    } else {
        job.source.files.forEach(fileName => gdalDocker.mount(fileName));
    }

    const sourceFiles = job.source.files.map(c => c.replace('s3://', '/vsis3/'));
    await gdalDocker.run([...buildVrtCmd, vrtPath, ...sourceFiles], logger);

    return vrtPath;
}

/**
 * Warp an existing vrt into EPSG3857 if required
 * @param job
 * @param vrtPath
 * @param options
 * @param tmpTarget
 * @param logger
 */
export async function buildWarpedVrt(
    job: CogJob,
    vrtPath: string,
    options: VrtOptions,
    tmpTarget: string,
    logger: LogType,
): Promise<string> {
    if (!options.forceEpsg3857) {
        return vrtPath;
    }
    const vrtWarpedPath = FileOperator.join(tmpTarget, `${job.id}.${EPSG.Google}.vrt`);

    logger.info({ path: vrtWarpedPath }, 'BuildVrt:Warped');
    const gdalWarpDocker = new GdalDocker();
    gdalWarpDocker.mount(vrtWarpedPath);
    job.source.files.forEach(fileName => gdalWarpDocker.mount(fileName));
    gdalWarpDocker.parser.on('progress', onProgress({ target: `vrt.${EPSG.Google}` }, logger));

    await gdalWarpDocker.run(
        ['gdalwarp', '-of', 'VRT', '-t_srs', Projection.toEpsgString(EPSG.Google), vrtPath, vrtWarpedPath],
        logger,
    );

    return vrtWarpedPath;
}
