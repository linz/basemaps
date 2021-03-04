import { Bounds, Tile, TileMatrixSet } from '@basemaps/geo';
import {
    Aws,
    Env,
    LogType,
    TileMetadataImageryRecord,
    TileMetadataNamedTag,
    TileMetadataSetRecord,
    TileMetadataTag,
    TileResizeKernel,
} from '@basemaps/shared';
import { Composition } from '@basemaps/tiler';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import pLimit from 'p-limit';
import { Tiler } from '@basemaps/tiler';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

export class TileSet {
    name: string;
    tag: TileMetadataTag;
    tileMatrix: TileMatrixSet;
    tiler: Tiler;
    tileSet: TileMetadataSetRecord;
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
        if (name == null) {
            return record.uri;
        }
        if (record.uri.endsWith('/')) {
            throw new Error("Invalid uri ending with '/' " + record.uri);
        }
        return `${record.uri}/${name}.tiff`;
    }

    constructor(nameStr: string, tileMatrix: TileMatrixSet) {
        const { name, tag } = Aws.tileMetadata.TileSet.parse(nameStr);
        this.name = name;
        this.tag = tag ?? TileMetadataNamedTag.Production;
        this.tileMatrix = tileMatrix;
        this.tiler = new Tiler(this.tileMatrix);
    }

    get background(): { r: number; g: number; b: number; alpha: number } | undefined {
        return this.tileSet?.background;
    }

    get resizeKernel(): { in: TileResizeKernel; out: TileResizeKernel } | undefined {
        return this.tileSet?.resizeKernel;
    }

    get taggedName(): string {
        if (this.tag === TileMetadataNamedTag.Production) return this.name;
        return `${this.name}@${this.tag}`;
    }

    get id(): string {
        return `${this.taggedName}_${this.tileMatrix.identifier}`;
    }

    get title(): string {
        return this.titleOverride ?? this.tileSet.title ?? this.name;
    }

    get description(): string {
        return this.tileSet.description ?? '';
    }

    get extent(): Bounds {
        return this.extentOverride ?? this.tileMatrix.extent;
    }

    async load(): Promise<boolean> {
        const tileSet = await Aws.tileMetadata.TileSet.get(this.name, this.tileMatrix.projection, this.tag);
        if (tileSet == null) return false;
        this.tileSet = tileSet;
        this.imagery = await Aws.tileMetadata.Imagery.getAll(this.tileSet);
        Aws.tileMetadata.TileSet.sortRenderRules(tileSet, this.imagery);
        return true;
    }

    private async initTiffs(tile: Tile, log: LogType): Promise<CogTiff[]> {
        const tiffs = this.getTiffsForTile(this.tileMatrix, tile);
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
        if (failed) {
            return tiffs.filter((f) => f.images.length > 0);
        }
        return tiffs;
    }

    public async tile(xyz: Tile, log: LogType): Promise<Composition[]> {
        const tiffs = await this.initTiffs(xyz, log);
        return this.tiler.tile(tiffs, xyz.x, xyz.y, xyz.z);
    }

    /**
     * Get a list of tiffs in the rendering order that is needed to render the tile
     * @param tms tile matrix set to describe the tiling scheme
     * @param tile tile to render
     */
    public getTiffsForTile(tms: TileMatrixSet, tile: Tile): CogTiff[] {
        const output: CogTiff[] = [];
        const tileBounds = tms.tileToSourceBounds(tile);
        const zFilter = tms.getParentZoom(tile.z);
        for (const rule of this.tileSet.rules) {
            if (zFilter > (rule.maxZoom ?? 32)) continue;
            if (zFilter < (rule.minZoom ?? 0)) continue;

            const imagery = this.imagery.get(rule.imgId);
            if (imagery == null) continue;
            if (!tileBounds.intersects(Bounds.fromJson(imagery.bounds))) continue;

            for (const tiff of this.getCogsForTile(imagery, tileBounds)) {
                output.push(tiff);
            }
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
                const source = CogSourceAwsS3.createFromUri(TileSet.basePath(record, c.name), Aws.s3);
                if (source == null) {
                    throw new Error(`Failed to create CogSource from  ${TileSet.basePath(record, c.name)}`);
                }
                existing = new CogTiff(source);
                this.sources.set(tiffKey, existing);
            }

            output.push(existing);
        }
        return output;
    }
}
