import { Bounds, Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import {
    Aws,
    DefaultBackground,
    Env,
    LogType,
    TileDataXyz,
    TileMetadataImageryRecord,
    TileMetadataSetRecordV2,
} from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { CogTiff } from '@cogeotiff/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { Metrics } from '@linzjs/metrics';
import pLimit from 'p-limit';
import { NotModified, TileComposer } from './routes/tile';
import { TileEtag } from './routes/tile.etag';
import { TileSetHandler } from './tile.set';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

export interface TileSetResponse {
    buffer: Buffer;
    metrics: Metrics;
    layersUsed: number;
    layersTotal: number;
    contentType: string;
}

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;

export class TileSetRaster extends TileSetHandler<TileMetadataSetRecordV2> {
    type = 'raster' as const;

    tileMatrix: TileMatrixSet;
    tiler: Tiler;
    imagery: Map<string, TileMetadataImageryRecord>;
    sources: Map<string, CogTiff> = new Map();
    titleOverride: string;
    extentOverride: Bounds;

    /**
     * Return the location of a imagery `record`
     * @param record
     * @param name the COG to locate. Return just the directory if `null`
     */
    static basePath(record: TileMetadataImageryRecord, name?: string): string {
        if (name == null) return record.uri;
        if (record.uri.endsWith('/')) throw new Error("Invalid uri ending with '/' " + record.uri);
        return `${record.uri}/${name}.tiff`;
    }

    constructor(name: string, tileMatrix: TileMatrixSet) {
        super(name, tileMatrix);
        this.tiler = new Tiler(this.tileMatrix);
    }

    get title(): string {
        return this.tileSet.title ?? this.components.name;
    }

    get description(): string {
        return this.tileSet.description ?? '';
    }

    get extent(): Bounds {
        return this.extentOverride ?? this.tileMatrix.extent;
    }

    async initTiffs(tile: Tile, log: LogType): Promise<CogTiff[]> {
        const tiffs = this.getTiffsForTile(tile);
        let failed = false;
        // Remove any tiffs that failed to load
        const promises = tiffs.map((c) => {
            return LoadingQueue(async () => {
                try {
                    await c.init();
                } catch (error) {
                    log.warn({ error, tiff: c.source.name }, 'TiffLoadFailed');
                    failed = true;
                }
            });
        });
        await Promise.all(promises);
        if (failed) return tiffs.filter((f) => f.images.length > 0);
        return tiffs;
    }

    public async tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
        const tiffs = await this.initTiffs(xyz, req.log);
        const layers = await this.tiler.tile(tiffs, xyz.x, xyz.y, xyz.z);

        // Generate a unique hash given the full URI, the layers used and a renderId
        const cacheKey = TileEtag.generate(layers, xyz);
        req.set('layers', layers.length);
        if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

        req.timer.start('tile:compose');
        const res = await TileComposer.compose({
            layers,
            format: xyz.ext,
            background: this.tileSet.background ?? DefaultBackground,
            resizeKernel: this.tileSet.resizeKernel ?? DefaultResizeKernel,
        });
        req.timer.end('tile:compose');

        req.set('layersUsed', res.layers);
        req.set('allLayersUsed', res.layers === layers.length);
        req.set('bytes', res.buffer.byteLength);

        const response = new LambdaHttpResponse(200, 'ok');
        response.header(HttpHeader.ETag, cacheKey);
        response.header(HttpHeader.CacheControl, 'public, max-age=604800');
        response.buffer(res.buffer, 'image/' + xyz.ext);
        return response;
    }

    /**
     * Get a list of tiffs in the rendering order that is needed to render the tile
     * @param tms tile matrix set to describe the tiling scheme
     * @param tile tile to render
     */
    public getTiffsForTile(tile: Tile): CogTiff[] {
        const output: CogTiff[] = [];
        const tileBounds = this.tileMatrix.tileToSourceBounds(tile);

        const filterZoom = TileMatrixSet.convertZoomLevel(
            tile.z,
            this.tileMatrix,
            TileMatrixSets.get(this.tileMatrix.projection),
        );
        for (const rule of this.tileSet.rules) {
            if (rule.maxZoom != null && filterZoom > rule.maxZoom) continue;
            if (rule.minZoom != null && filterZoom < rule.minZoom) continue;

            const imagery = this.imagery.get(rule.imgId);
            if (imagery == null) continue;
            if (!tileBounds.intersects(Bounds.fromJson(imagery.bounds))) continue;

            for (const tiff of this.getCogsForTile(imagery, tileBounds)) output.push(tiff);
        }
        return output;
    }

    private getCogsForTile(record: TileMetadataImageryRecord, tileBounds: Bounds): CogTiff[] {
        const output: CogTiff[] = [];
        for (const c of record.files) {
            if (!tileBounds.intersects(Bounds.fromJson(c))) continue;

            const tiffKey = `${record.id}_${c.name}`;
            let existing = this.sources.get(tiffKey);
            if (existing == null) {
                const source = SourceAwsS3.fromUri(TileSetRaster.basePath(record, c.name), Aws.s3);
                if (source == null) {
                    throw new Error(`Failed to create CogSource from  ${TileSetRaster.basePath(record, c.name)}`);
                }
                existing = new CogTiff(source);
                this.sources.set(tiffKey, existing);
            }

            output.push(existing);
        }
        return output;
    }
}
