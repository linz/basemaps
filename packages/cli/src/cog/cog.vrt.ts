import { Epsg } from '@basemaps/geo';
import { Aws, FileOperator, isConfigS3Role, LogType } from '@basemaps/shared';
import { Gdal } from '../gdal/gdal';
import { GdalCommand } from '../gdal/gdal.command';
import { onProgress } from './cog';
import { Cutline } from './cutline';
import { CogJob } from './types';

/**
 * Build the VRT for the needed source imagery
 */
async function buildPlainVrt(
    job: CogJob,
    sourceFiles: string[],
    vrtPath: string,
    gdalCommand: GdalCommand,
    logger: LogType,
): Promise<void> {
    const buildOpts = ['-hidenodata', '-allow_projection_difference'];
    if (job.output.vrt.addAlpha) {
        buildOpts.push('-addalpha');
    }

    logger.debug({ buildOpts: buildOpts.join(' ') }, 'gdalbuildvrt');
    await gdalCommand.run('gdalbuildvrt', [...buildOpts, vrtPath, ...sourceFiles], logger);
}

/**
 * Warp the source vrt to target projection using an optional cutline
 */
async function buildWarpVrt(
    job: CogJob,
    sourceVrtPath: string,
    gdalCommand: GdalCommand,
    cogVrtPath: string,
    tr: string,
    logger: LogType,
    cutlineTarget: string,
): Promise<void> {
    const warpOpts = [
        '-of',
        'VRT',
        '-multi',
        '-wo',
        'NUM_THREADS=ALL_CPUS',
        '-s_srs',
        Epsg.get(job.source.projection).toEpsgString(),
        '-t_srs',
        Epsg.get(job.projection).toEpsgString(),
        '-tr',
        tr,
        tr,
        '-tap',
    ];
    if (job.output.cutline != null) {
        warpOpts.push('-cutline', cutlineTarget);
        if (job.output.cutline.blend != 0) warpOpts.push('-cblend', String(job.output.cutline.blend));
    }
    if (job.output.nodata != null) {
        warpOpts.push('-srcnodata', String(job.output.nodata), '-dstnodata', String(job.output.nodata));
    }
    if (job.output.resampling) {
        warpOpts.push('-r', job.output.resampling.warp);
    }

    logger.debug({ warpOpts: warpOpts.join(' ') }, 'gdalwarp');
    await gdalCommand.run('gdalwarp', [...warpOpts, cogVrtPath, sourceVrtPath], logger);
}

export const CogVrt = {
    /**
     * Build a vrt file for a COG `name` that transforms the source imagery with a cutline
     *
     * @param tmpFolder temporary `vrt` and `cutline.geojson` will be written here
     * @param job
     * @param cutline Used to filter the source imagery
     * @param name COG tile to reduce vrt and cutline
     * @param logger
     *
     * @return the path to the vrt file
     */
    async buildVrt(
        tmpFolder: string,
        job: CogJob,
        cutline: Cutline,
        name: string,
        logger: LogType,
    ): Promise<string | null> {
        logger.info({ name }, 'buildCogVrt');

        const sourceFiles = cutline.filterSourcesForName(name, job).map((name) => name.replace('s3://', '/vsis3/'));

        if (sourceFiles.length == 0) {
            return null;
        }

        const sourceVrtPath = FileOperator.join(tmpFolder, `source.vrt`);
        const cogVrtPath = FileOperator.join(tmpFolder, `cog.vrt`);

        let cutlineTarget = '';

        if (cutline.clipPoly.length != 0) {
            cutlineTarget = FileOperator.join(tmpFolder, 'cutline.geojson');
            await FileOperator.writeJson(cutlineTarget, cutline.toGeoJson());
        } else {
            job.output.cutline = undefined;
        }

        logger.info(
            {
                inputTotal: job.source.files.length,
                outputTotal: sourceFiles.length,
                cutlinePolygons: cutline.clipPoly.length,
            },
            'Tiff count',
        );

        const gdalCommand = Gdal.create();

        // If required assume role
        if (isConfigS3Role(job.source)) {
            const credentials = Aws.credentials.getCredentialsForRole(job.source.roleArn, job.source.externalId);
            gdalCommand.setCredentials(credentials);
        }

        if (gdalCommand.mount != null) {
            gdalCommand.mount(tmpFolder);
            for (const file of job.source.files) gdalCommand.mount(file.name);
        }

        const tr = cutline.tms.pixelScale(job.source.resZoom).toString();

        onProgress(gdalCommand, { target: `vrt.${job.projection}` }, logger);
        await buildPlainVrt(job, sourceFiles, sourceVrtPath, gdalCommand, logger);
        await buildWarpVrt(job, cogVrtPath, gdalCommand, sourceVrtPath, tr, logger, cutlineTarget);
        return cogVrtPath;
    },
};
