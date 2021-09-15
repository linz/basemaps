import { Gdal } from '@basemaps/cli';
import { GdalCommand } from '@basemaps/cli/build/gdal/gdal.command';
import { Bounds, Epsg, Tile, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType, s3ToVsis3 } from '@basemaps/shared';
import * as os from 'os';
import type { Limit } from 'p-limit';
import PLimit from 'p-limit';
import * as path from 'path';
import { basename } from 'path';
import { FilePath, FileType } from './file.js';
import { Hash } from './hash.js';
import { MapnikRender } from './mapnik.js';
import { Stac } from './stac.js';

interface BathyMakerContext {
    /** unique id for this build */
    id: string;
    /** Source netcdf or tiff file path */
    inputPath: string;
    /** Output directory path */
    outputPath: string;
    tmpFolder: FilePath;
    /** TileMatrixSet to cut the bathy up into tiles */
    tileMatrix: TileMatrixSet;
    /** zoom level of the tms to cut the tiles too */
    zoom: number;
    /** Number of threads used to convert @default NUM_CPUS */
    threads?: number;
    /** Mapnik render tilesize @default 8192 */
    tileSize?: number;
}

function createMountedGdal(...paths: string[]): GdalCommand {
    const gdal = Gdal.create();
    if (gdal.mount != null) {
        for (const path of paths) gdal.mount(path);
    }
    return gdal;
}

export const BathyMakerContextDefault = {
    threads: os.cpus().length,
    /** Making this much larger than this takes quite a long time to render */
    tileSize: 8192,
};

export class BathyMaker {
    config: BathyMakerContext & typeof BathyMakerContextDefault;

    /** Current gdal version @see Gdal.version */
    gdalVersion: Promise<string>;
    /** Concurrent limiting queue, all work should be done inside the queue */
    q: Limit;

    constructor(ctx: BathyMakerContext) {
        this.config = { ...BathyMakerContextDefault, ...ctx };
        this.q = PLimit(this.config.threads);
    }

    get inputPath(): string {
        return this.config.inputPath;
    }

    get inputFolder(): string {
        return path.dirname(this.inputPath);
    }

    get outputPath(): string {
        return this.config.outputPath;
    }

    get tmpFolder(): FilePath {
        return this.config.tmpFolder;
    }

    isTiffInput(): boolean {
        return this.inputPath.endsWith('.tiff');
    }

    /** Most operations need a tiff file */
    get tiffPath(): string {
        if (this.isTiffInput()) return this.inputPath;
        return this.tmpFolder.name(FileType.SourceTiff);
    }

    /** File name of the path */
    get fileName(): string {
        return path.basename(this.inputPath);
    }

    async render(logger: LogType): Promise<void> {
        this.gdalVersion = Gdal.version(logger);

        const isNc = this.inputPath.endsWith('.nc');

        // NetCdf files need to be converted to GeoTiff before processing
        if (isNc) await this.createSourceGeoTiff(logger);
        await this.createSourceHash(logger);

        const { tileMatrix: tms, zoom } = this.config;

        const tmsZoom = tms.zooms[zoom];
        logger.info(
            { file: this.fileName, zoom, tileCount: tmsZoom.matrixWidth * tmsZoom.matrixHeight },
            'Splitting Tiles',
        );

        const gdalVersion = await this.gdalVersion;
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const promises = [];
        let extent: Bounds | null = null;
        for (let x = 0; x < tmsZoom.matrixWidth; x++) {
            for (let y = 0; y < tmsZoom.matrixHeight; y++) {
                const promise = this.q(() => {
                    const tile = { x, y, z: zoom };
                    const bounds = tms.tileToSourceBounds(tile);
                    extent = extent == null ? bounds : extent.union(bounds);
                    const tileId = TileMatrixSet.tileToName(tile);
                    return this.renderTile(tile, logger.child({ index: tileId }));
                });
                promises.push(promise);
            }
        }
        try {
            const tileNames = await Promise.all(promises);
            if (extent == null) return;
            await this.createMetadata(extent, tileNames, logger);
        } catch (err) {
            logger.fatal(err, 'FailedToRun');
            throw err;
        }
    }

    /** Create a multi hash of the source file  */
    async createSourceHash(logger: LogType): Promise<string> {
        const hashPath = this.tmpFolder.name(FileType.Hash);
        if (await fsa.exists(hashPath)) return (await fsa.read(hashPath)).toString();
        logger.info({ hashPath }, 'CreateHash');

        const outputHash = await Hash.hash(this.inputPath);
        await fsa.write(hashPath, Buffer.from(outputHash));
        return outputHash;
    }

    /** Render a specific tile */
    async renderTile(tile: Tile, logger: LogType): Promise<string> {
        try {
            await this.createTile(tile, logger);
            await this.createHillShadedTile(tile, logger);
            await this.createCompositeTile(tile, logger);
            return await this.createTileMetadata(tile);
        } catch (err) {
            logger.error({ err }, 'Failed');
            throw err;
        }
    }

    /** convert a input file into one that can be processed by this script */
    async createSourceGeoTiff(logger: LogType): Promise<void> {
        if (this.isTiffInput()) return;
        logger.info({ path: this.tiffPath }, 'Converting to GeoTiff');
        const gdal = createMountedGdal(this.tmpFolder.sourcePath, this.inputFolder);

        await gdal.run(
            'gdal_translate',
            [
                '-of',
                'GTiff',
                // Files need to be converted to Float32 to fix a weird outline bug with the resampling
                // see https://github.com/linz/basemaps-team/issues/241
                '-ot',
                'Float32',
                s3ToVsis3(this.inputPath),
                this.tiffPath,
            ],
            logger,
        );
    }

    /** Create a tile in the output TMS's CRS */
    async createTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);
        const warpedPath = this.tmpFolder.name(FileType.Warped, tileId);
        if (await fsa.exists(warpedPath)) return;

        const tms = this.config.tileMatrix;

        const bounds = tms.tileToSourceBounds(tile);
        const warpCommand = [
            '-of',
            'GTIFF',
            '-co',
            'NUM_THREADS=ALL_CPUS',
            '-s_srs',
            Epsg.Wgs84.toEpsgString(),
            '-t_srs',
            tms.projection.toEpsgString(),
            '-r',
            'bilinear',
            '-te',
            ...bounds.toBbox(),
            this.tiffPath,
            warpedPath,
        ].map(String);

        logger.trace({ file: warpedPath }, 'Warping');
        const gdal = createMountedGdal(this.tmpFolder.sourcePath, this.tiffPath);
        await gdal.run('gdalwarp', warpCommand, logger);
    }

    /** Create a hillshade for a tile */
    async createHillShadedTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);
        const warped = this.tmpFolder.name(FileType.Warped, tileId);
        const target = this.tmpFolder.name(FileType.HillShade, tileId);

        if (await fsa.exists(target)) return;

        logger.trace({ file: target }, 'Shading');

        const gdal = createMountedGdal(this.inputPath, this.tmpFolder.sourcePath);
        await gdal.run('gdaldem', ['hillshade', '-compute_edges', '-multidirectional', warped, target], logger);
    }

    /** Use mapnik to composite the hillshaded tile and the rendered tile */
    async createCompositeTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);

        const renderedPath = await MapnikRender.render(this, tile, logger);
        const outputPath = this.tmpFolder.name(FileType.Output, tileId);
        if (await fsa.exists(outputPath)) return;

        const gdal = createMountedGdal(this.tmpFolder.sourcePath);
        const tileMatrix = this.config.tileMatrix;
        const bounds = tileMatrix.tileToSourceBounds(tile);
        await gdal.run(
            'gdal_translate',
            [
                '-of',
                'GTiff',
                '-co',
                'NUM_THREADS=ALL_CPUS',
                '-co',
                'COMPRESS=webp',
                '-co',
                'WEBP_LEVEL=100',
                '-r',
                'bilinear',
                '-a_srs',
                tileMatrix.projection.toEpsgString(),
                '-a_ullr',
                ...[bounds.x, bounds.bottom, bounds.right, bounds.y],
                renderedPath,
                outputPath,
            ].map(String),
            logger,
        );
    }
    /** Create and write a stac metadata item for a single tile */
    async createTileMetadata(tile: Tile): Promise<string> {
        const output = await Stac.createItem(this, tile);
        const tileId = TileMatrixSet.tileToName(tile);
        const stacOutputPath = this.tmpFolder.name(FileType.Stac, tileId);
        await fsa.writeJson(stacOutputPath, output);
        return basename(stacOutputPath);
    }

    async createMetadata(bounds: Bounds, itemPaths: string[], logger: LogType): Promise<void> {
        const output = await Stac.createCollection(this, bounds, itemPaths, logger);
        const stacOutputPath = this.tmpFolder.name(FileType.Stac, 'collection');
        await fsa.writeJson(stacOutputPath, output);
    }
}

module.exports = { BathyMaker };
