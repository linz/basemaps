import { Bounds, Epsg, Tile, TileMatrixSet } from '@basemaps/geo';
import {
    Aws,
    TileMetadataImageryRecord,
    TileMetadataImageryRecordV1,
    TileMetadataSetRecord,
    TileMetadataTag,
    TileSetRuleImagery,
    ProjectionTileMatrixSet,
} from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';

export class TileSet {
    name: string;
    tag: TileMetadataTag;
    projection: Epsg;
    tileSet: TileMetadataSetRecord;
    imagery: TileSetRuleImagery[];
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

    constructor(nameStr: string, projection: Epsg) {
        const { name, tag } = Aws.tileMetadata.TileSet.parse(nameStr);
        this.name = name;
        this.tag = tag ?? TileMetadataTag.Production;
        this.projection = projection;
    }

    get background(): { r: number; g: number; b: number; alpha: number } | undefined {
        return this.tileSet?.background;
    }

    get taggedName(): string {
        if (this.tag == TileMetadataTag.Production) return this.name;
        return `${this.name}@${this.tag}`;
    }

    get id(): string {
        return `${this.taggedName}_${this.projection}`;
    }

    get title(): string {
        return this.titleOverride ?? this.tileSet.title ?? this.name;
    }

    get description(): string {
        return this.tileSet.description ?? '';
    }

    get extent(): Bounds {
        return this.extentOverride ?? ProjectionTileMatrixSet.get(this.projection.code).tms.extent;
    }

    async load(): Promise<boolean> {
        const tileSet = await Aws.tileMetadata.TileSet.get(this.name, this.projection, this.tag);
        if (tileSet == null) return false;
        this.tileSet = tileSet;
        this.imagery = await Aws.tileMetadata.Imagery.getAll(this.tileSet);
        return true;
    }

    public getTiffsForTile(tms: TileMatrixSet, tile: Tile): CogTiff[] {
        const output: CogTiff[] = [];
        const tileBounds = tms.tileToSourceBounds(tile);
        for (const obj of this.imagery) {
            if (tile.z > (obj.rule.maxZoom ?? 32)) continue;
            if (tile.z < (obj.rule.minZoom ?? 0)) continue;
            if (!tileBounds.intersects(Bounds.fromJson(obj.imagery.bounds))) continue;

            for (const tiff of this.getCogsForTile(obj.imagery, tileBounds)) {
                output.push(tiff);
            }
        }
        return output;
    }

    private getCogsForTile(record: TileMetadataImageryRecordV1, tileBounds: Bounds): CogTiff[] {
        const output: CogTiff[] = [];
        for (const c of record.files) {
            if (!tileBounds.intersects(Bounds.fromJson(c))) continue;

            const tiffKey = `${record.id}_${c.name}`;
            let existing = this.sources.get(tiffKey);
            if (existing == null) {
                const source = CogSourceAwsS3.createFromUri(TileSet.basePath(record, c.name));
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
