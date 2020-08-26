import { Gdal } from '@basemaps/cli';
import { Bounds, Epsg, Tile, TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import * as fs from 'fs';
import * as os from 'os';
import type { Limit } from 'p-limit';
import PLimit from 'p-limit';
import * as path from 'path';
import { basename } from 'path';
import { FilePath, FileType } from './file';
import { Hash } from './hash';
import { MapnikRender } from './mapnik';
import { Stac } from './stac';

interface BathyMakerContext {
    /** unique id for this build */
    id: string;
    /** Source file path Must be local file system */
    path: string;
    /** TileMatrixSet to cut the bathy up into tiles */
    tms: TileMatrixSet;
    /** zoom level of the tms to cut the tiles too */
    zoom: number;
    /** Number of threads used to convert @default NUM_CPUS */
    threads?: number;
    /** Mapnik render tilesize @default 8192 */
    tileSize?: number;
}

export const BathyMakerContextDefault = {
    threads: os.cpus().length,
    /** Making this much larger than this takes quite a long time to render */
    tileSize: 8192,
};

export class BathyMaker {
    config: BathyMakerContext & typeof BathyMakerContextDefault;

    file: FilePath;

    /** Current gdal version @see Gdal.version */
    gdalVersion: Promise<string>;
    /** Concurrent limiting queue, all work should be done inside the queue */
    q: Limit;

    constructor(ctx: BathyMakerContext) {
        this.config = { ...BathyMakerContextDefault, ...ctx };
        this.q = PLimit(this.config.threads);
        this.file = new FilePath(this.config.path);
    }

    get filePath(): string {
        return this.config.path;
    }

    /** Most operations need a tiff file */
    get tiffPath(): string {
        if (this.filePath.endsWith('.tiff')) return this.filePath;
        return this.filePath + '.tiff';
    }

    /** File name of the path */
    get fileName(): string {
        return path.basename(this.filePath);
    }

    async render(logger: LogType): Promise<void> {
        this.gdalVersion = Gdal.version(logger);

        const isNc = this.filePath.endsWith('.nc');

        // NetCdf files need to be converted to GeoTiff before processing
        if (isNc) await this.createSourceGeoTiff(logger);
        await this.createSourceHash(logger);

        const { tms, zoom } = this.config;

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
            this.createMetadata(extent, tileNames);
        } catch (err) {
            logger.fatal(err, 'FailedToRun');
            throw err;
        }
    }

    /** Create a multi hash of the source file  */
    async createSourceHash(logger: LogType): Promise<string> {
        const hashPath = this.file.name(FileType.Hash);
        if (fs.existsSync(hashPath)) return (await fs.promises.readFile(hashPath)).toString();
        logger.info({ hashPath }, 'CreateHash');

        const outputHash = await Hash.hash(this.filePath);
        await fs.promises.writeFile(hashPath, outputHash);
        return outputHash;
    }

    /** Render a specific tile */
    async renderTile(tile: Tile, logger: LogType): Promise<string> {
        try {
            await this.createTile(tile, logger);
            await this.createHillShadedTile(tile, logger);
            await this.createCompositeTile(tile, logger);
            return await this.createTileMetadata(tile, logger);
        } catch (err) {
            logger.error({ err }, 'Failed');
            throw err;
        }
    }

    /** convert a input file into one that can be processed by this script */
    async createSourceGeoTiff(logger: LogType): Promise<void> {
        if (fs.existsSync(this.tiffPath)) return;
        logger.info({ path: this.tiffPath }, 'Converting to GeoTiff');
        const gdal = Gdal.create();
        await gdal.run(
            'gdal_translate',
            [
                '-of',
                'GTiff',
                // Files need to be converted to Float32 to fix a weird outline bug with the resampling
                // see https://github.com/linz/basemaps-team/issues/241
                '-ot',
                'Float32',
                this.filePath,
                this.tiffPath,
            ],
            logger,
        );
    }

    /** Create a tile in the output TMS's CRS */
    async createTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);
        const warpedPath = this.file.name(FileType.Warped, tileId);
        if (fs.existsSync(warpedPath)) return;

        const tms = this.config.tms;

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

        const gdal = Gdal.create();
        if (gdal.mount) gdal.mount(path.dirname(this.tiffPath));

        logger.trace({ file: warpedPath }, 'Warping');
        await gdal.run('gdalwarp', warpCommand, logger);
    }

    /** Create a hillshade for a tile */
    async createHillShadedTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);
        const warped = this.file.name(FileType.Warped, tileId);
        const target = this.file.name(FileType.HillShade, tileId);

        if (fs.existsSync(target)) return;

        const gdal = Gdal.create();
        if (gdal.mount) gdal.mount(path.dirname(this.filePath));

        logger.trace({ file: target }, 'Shading');
        await gdal.run('gdaldem', ['hillshade', '-compute_edges', '-multidirectional', warped, target], logger);
    }

    /** Use mapnik to composite the hillshaded tile and the rendered tile */
    async createCompositeTile(tile: Tile, logger: LogType): Promise<void> {
        const tileId = TileMatrixSet.tileToName(tile);

        const renderedPath = await MapnikRender.render(this, tile, logger);
        const outputPath = this.file.name(FileType.Output, tileId);
        if (fs.existsSync(outputPath)) return;

        const gdal = Gdal.create();
        if (gdal.mount) gdal.mount(path.dirname(this.filePath));
        const bounds = this.config.tms.tileToSourceBounds(tile);
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
                Epsg.Google.toEpsgString(),
                '-a_ullr',
                ...[bounds.x, bounds.bottom, bounds.right, bounds.y],
                renderedPath,
                outputPath,
            ].map(String),
            logger,
        );
    }
    /** Create and write a stac metadata item for a single tile */
    async createTileMetadata(tile: Tile, logger: LogType): Promise<string> {
        const output = await Stac.createItem(this, tile, logger);
        const tileId = TileMatrixSet.tileToName(tile);
        const stacOutputPath = this.file.name(FileType.Stac, tileId);
        await fs.promises.writeFile(stacOutputPath, JSON.stringify(output, null, 2));
        return basename(stacOutputPath);
    }

    async createMetadata(bounds: Bounds, itemPaths: string[]): Promise<void> {
        const output = await Stac.createCollection(this, bounds, itemPaths);
        const stacOutputPath = this.file.name(FileType.Stac, 'collection.json');
        await fs.promises.writeFile(stacOutputPath, JSON.stringify(output, null, 2));
    }
}

module.exports = { BathyMaker };
