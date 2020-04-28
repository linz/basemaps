import { EPSG, Projection } from '@basemaps/geo';
import { Aws, FileOperator, isConfigS3Role, LogType } from '@basemaps/lambda-shared';
import { onProgress } from './cog';
import { GdalCogBuilder } from '../gdal/gdal';
import { CogJob } from './types';

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
    const gdalCommand = GdalCogBuilder.getGdal();
    gdalCommand.parser.on('progress', onProgress({ target: 'vrt' }, logger));

    const buildVrtCmd = ['-hidenodata'];
    if (options.addAlpha) {
        buildVrtCmd.push('-addalpha');
    }
    if (gdalCommand.mount) {
        gdalCommand.mount(vrtPath);
    }

    // If required assume role
    if (isConfigS3Role(job.source)) {
        const credentials = Aws.credentials.getCredentialsForRole(job.source.roleArn, job.source.externalId);
        await gdalCommand.setCredentials(credentials);
    } else {
        if (gdalCommand.mount) {
            for (const file of job.source.files) {
                gdalCommand.mount(file);
            }
        }
    }

    const sourceFiles = job.source.files.map((c) => c.replace('s3://', '/vsis3/'));
    await gdalCommand.run('gdalbuildvrt', [...buildVrtCmd, vrtPath, ...sourceFiles], logger);

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
    const gdalCommand = GdalCogBuilder.getGdal();
    if (gdalCommand.mount) {
        gdalCommand.mount(tmpTarget);
        for (const file of job.source.files) {
            gdalCommand.mount(file);
        }
    }
    gdalCommand.parser.on('progress', onProgress({ target: `vrt.${EPSG.Google}` }, logger));

    const warpOpts = [
        '-of',
        'VRT',
        '-multi',
        '-wo',
        'NUM_THREADS=ALL_CPUS',
        '-t_srs',
        Projection.toEpsgString(EPSG.Google),
        vrtPath,
        vrtWarpedPath,
    ];
    const { cutlineBlend } = job.output;
    if (cutlineBlend != null) {
        warpOpts.push('-cutline', FileOperator.join(tmpTarget, 'cutline.geojson'));
        if (cutlineBlend != 0) warpOpts.push('-cblend', String(cutlineBlend));
    }
    if (job.output.nodata != null) {
        warpOpts.push('-srcnodata', String(job.output.nodata), '-dstnodata', String(job.output.nodata));
    }
    if (job.output.resample) {
        warpOpts.push('-r', job.output.resample);
    }

    logger.debug({ warpOpts: warpOpts.join(' ') }, 'gdalwarp');
    await gdalCommand.run('gdalwarp', warpOpts, logger);

    return vrtWarpedPath;
}
