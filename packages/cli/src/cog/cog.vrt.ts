import { FileOperator, LogType, isConfigS3Role, Aws } from '@basemaps/shared';
import { FeatureCollection } from 'geojson';
import { Cutline } from './cutline';
import { CogJob } from './types';
import { onProgress } from './cog';
import { GdalCogBuilder } from '../gdal/gdal';
import { Epsg } from '@basemaps/geo';
import { GdalCommand } from '../gdal/gdal.command';

/**
 * Build the VRT for the needed source imagery
 */
async function buildPlainVrt(
    job: CogJob,
    vrtPath: string,
    gdalCommand: GdalCommand,
    defaultOps: string[],
    logger: LogType,
): Promise<void> {
    const buildOpts = ['-hidenodata', '-allow_projection_difference'].concat(defaultOps);
    if (job.output.vrt.addAlpha) {
        buildOpts.push('-addalpha');
    }

    // If required assume role
    if (isConfigS3Role(job.source)) {
        const credentials = Aws.credentials.getCredentialsForRole(job.source.roleArn, job.source.externalId);
        gdalCommand.setCredentials(credentials);
    } else {
        if (gdalCommand.mount) {
            for (const file of job.source.files) {
                gdalCommand.mount(file);
            }
        }
    }

    logger.debug({ buildOpts: buildOpts.join(' ') }, 'gdalbuildvrt');
    const sourceFiles = job.source.files.map((c) => c.replace('s3://', '/vsis3/'));
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
    defaultOps: string[],
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
    ].concat(defaultOps);
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
     * Build a vrt file for a `name` set with some tiffs transformed with a cutline
     *
     * @param tmpFolder temporary `vrt` and `cutline.geojson` will be written here
     * @param job
     * @param sourceGeo a GeoJSON object which contains the boundaries for the source imagery
     * @param cutline Used to filter the sources and cutline
     * @param name to reduce vrt and cutline
     * @param logger
     *
     * @return the path to the vrt file
     */
    async buildVrt(
        tmpFolder: string,
        job: CogJob,
        sourceGeo: FeatureCollection,
        cutline: Cutline,
        name: string,
        logger: LogType,
    ): Promise<string | null> {
        logger.info({ name }, 'buildCogVrt');

        const inputTotal = job.source.files.length;

        cutline.filterSourcesForName(name, job, sourceGeo);

        if (job.source.files.length == 0) {
            return null;
        }

        const sourceVrtPath = FileOperator.join(tmpFolder, `source.vrt`);
        const cogVrtPath = FileOperator.join(tmpFolder, `cog.vrt`);

        let cutlineTarget = '';

        if (cutline.clipPoly.length != 0) {
            cutlineTarget = FileOperator.join(tmpFolder, 'cutline.geojson');
            await FileOperator.create(cutlineTarget).writeJson(cutlineTarget, cutline.toGeoJson());
        } else {
            job.output.cutline = undefined;
        }

        logger.info(
            { inputTotal, outputTotal: job.source.files.length, cutlinePolygons: cutline.clipPoly.length },
            'Tiff count',
        );

        const gdalCommand = GdalCogBuilder.getGdal();
        if (gdalCommand.mount) {
            gdalCommand.mount(tmpFolder);
        }

        const tr = cutline.targetProj.tms.pixelScale(job.source.resZoom).toString();

        const defaultOps = ['-tr', tr, tr, '-tap'];

        onProgress(gdalCommand, { target: `vrt.${job.projection}` }, logger);
        await buildPlainVrt(job, sourceVrtPath, gdalCommand, defaultOps, logger);

        if (cutlineTarget !== '' || job.projection !== job.source.projection) {
            await buildWarpVrt(job, cogVrtPath, gdalCommand, sourceVrtPath, defaultOps, logger, cutlineTarget);
            return cogVrtPath;
        }

        return sourceVrtPath;
    },
};
