import { FileOperator, LogType, isConfigS3Role, Aws } from '@basemaps/shared';
import { FeatureCollection } from 'geojson';
import { Cutline } from './cutline';
import { CogJob } from './types';
import { onProgress } from './cog';
import { GdalCogBuilder } from '../gdal/gdal';
import { Epsg } from '@basemaps/geo';
import { GdalCommand } from '../gdal/gdal.command';

/**
 * Build a Plain VRT for source imagery; no projection nor cutline
 */
async function buildPlainVrt(job: CogJob, vrtPath: string, gdalCommand: GdalCommand, logger: LogType): Promise<void> {
    const buildOpts = ['-hidenodata'];
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
 * Warp an existing vrt into EPSG3857 if required
 */
async function buildWarpVrt(
    job: CogJob,
    sourceVrtPath: string,
    gdalCommand: GdalCommand,
    quadkeyVrtPath: string,
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
    ];
    if (job.output.cutline) {
        warpOpts.push('-cutline', cutlineTarget);
        if (job.output.cutline.blend != 0) warpOpts.push('-cblend', String(job.output.cutline.blend));
    }
    if (job.output.nodata != null) {
        warpOpts.push('-srcnodata', String(job.output.nodata), '-dstnodata', String(job.output.nodata));
    }
    if (job.output.resampling) {
        warpOpts.push('-r', job.output.resampling);
    }

    logger.debug({ warpOpts: warpOpts.join(' ') }, 'gdalwarp');
    await gdalCommand.run('gdalwarp', [...warpOpts, quadkeyVrtPath, sourceVrtPath], logger);
}

export const QuadKeyVrt = {
    /**
     * Build a vrt file for a quadKey set with some tiffs transformed with a cutline
     *
     * @param tmpFolder temporary `vrt` and `cutline.geojson` will be written here
     * @param job
     * @param sourceGeo a GeoJSON object which contains the boundaries for the source images
     * @param cutline Used to filter the sources and cutline
     * @param quadKey to reduce vrt and cutline
     * @param logger
     *
     * @return the path to the vrt file
     */
    async buildVrt(
        tmpFolder: string,
        job: CogJob,
        sourceGeo: FeatureCollection,
        cutline: Cutline,
        quadKey: string,
        logger: LogType,
    ): Promise<string> {
        logger.info({ quadKey }, 'buildCutlineVrt');

        const inputTotal = job.source.files.length;

        cutline.filterSourcesForQuadKey(quadKey, job, sourceGeo);

        if (job.source.files.length == 0) {
            return '';
        }

        const sourceVrtPath = FileOperator.join(tmpFolder, `source.vrt`);
        const quadkeyVrtPath = FileOperator.join(tmpFolder, `quadkey.vrt`);

        let cutlineTarget = '';

        if (cutline.polygons.length != 0) {
            cutlineTarget = FileOperator.join(tmpFolder, 'cutline.geojson');
            await FileOperator.create(cutlineTarget).writeJson(cutlineTarget, cutline.toGeoJson());
        }

        logger.info(
            { inputTotal, outputTotal: job.source.files.length, cutlinePolygons: cutline.polygons.length },
            'Tiff count',
        );

        const gdalCommand = GdalCogBuilder.getGdal();
        if (gdalCommand.mount) {
            gdalCommand.mount(tmpFolder);
        }
        onProgress(gdalCommand, { target: `vrt.${job.projection}` }, logger);
        await buildPlainVrt(job, sourceVrtPath, gdalCommand, logger);

        if (cutlineTarget !== '' || job.projection !== job.source.projection) {
            await buildWarpVrt(job, quadkeyVrtPath, gdalCommand, sourceVrtPath, logger, cutlineTarget);
            return quadkeyVrtPath;
        }

        return sourceVrtPath;
    },
};
