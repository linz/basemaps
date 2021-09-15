import { Epsg } from '@basemaps/geo';
import { Aws, fsa, isConfigS3Role, LogType, s3ToVsis3 } from '@basemaps/shared';
import { Gdal } from '../gdal/gdal.js';
import { GdalCommand } from '../gdal/gdal.command.js';
import { onProgress } from './cog.js';
import { Cutline } from './cutline.js';
import { CogJob } from './types.js';

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
    if (job.output.addAlpha) {
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
        Epsg.get(job.source.epsg).toEpsgString(),
        '-t_srs',
        job.tileMatrix.projection.toEpsgString(),
        '-tr',
        tr,
        tr,
        '-tap',
    ];
    if (job.output.cutline != null) {
        warpOpts.push('-cutline', cutlineTarget);
        if (job.output.cutline.blend !== 0) warpOpts.push('-cblend', String(job.output.cutline.blend));
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

        const sourceFiles = cutline.filterSourcesForName(name, job).map(s3ToVsis3);

        if (sourceFiles.length === 0) {
            return null;
        }

        const sourceVrtPath = fsa.join(tmpFolder, `source.vrt`);
        const cogVrtPath = fsa.join(tmpFolder, `cog.vrt`);

        let cutlineTarget = '';

        if (cutline.clipPoly.length !== 0) {
            cutlineTarget = fsa.join(tmpFolder, 'cutline.geojson');
            await fsa.writeJson(cutlineTarget, cutline.toGeoJson());
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

        const sourceLocation = job.source.location;
        // If required assume role
        if (isConfigS3Role(sourceLocation)) {
            const credentials = Aws.credentials.getCredentialsForRole(
                sourceLocation.roleArn,
                sourceLocation.externalId,
            );
            gdalCommand.setCredentials(credentials);
        }

        if (gdalCommand.mount != null) {
            gdalCommand.mount(tmpFolder);
            for (const file of job.source.files) gdalCommand.mount(file.name);
        }

        const tr = job.output.gsd.toString();

        onProgress(gdalCommand, { target: `vrt.${job.tileMatrix.projection.code}` }, logger);
        await buildPlainVrt(job, sourceFiles, sourceVrtPath, gdalCommand, logger);
        await buildWarpVrt(job, cogVrtPath, gdalCommand, sourceVrtPath, tr, logger, cutlineTarget);
        return cogVrtPath;
    },
};
