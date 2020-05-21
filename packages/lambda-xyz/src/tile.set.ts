import { EPSG, QuadKey } from '@basemaps/geo';
import {
    Aws,
    Env,
    RecordPrefix,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataTable,
    TileMetadataTag,
    TileSetRuleImagery,
} from '@basemaps/lambda-shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import * as path from 'path';

export class TileSet {
    name: string;
    tag: TileMetadataTag;
    projection: EPSG;
    private tileSet: TileMetadataSetRecord;
    imagery: TileSetRuleImagery[];
    sources: Map<string, CogTiff> = new Map();
    bucket: string;

    static BasePath(record: TileMetadataImageryRecord, quadKey?: string): string {
        const id = TileMetadataTable.unprefix(RecordPrefix.Imagery, record.id);
        const basePath = [record.projection, record.name, id].join('/');
        if (quadKey == null) {
            return basePath;
        }
        return path.join(basePath, `${quadKey}.tiff`);
    }

    constructor(nameStr: string, projection: EPSG, bucket: string | undefined = process.env[Env.CogBucket]) {
        const { name, tag } = Aws.tileMetadata.TileSet.parse(nameStr);
        this.name = name;
        this.tag = tag ?? TileMetadataTag.Production;
        this.projection = projection;

        if (bucket == null) throw new Error(`Invalid environment missing "${Env.CogBucket}"`);
        this.bucket = bucket;
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
        return this.tileSet.title ?? this.name;
    }

    get description(): string {
        return this.tileSet.description ?? '';
    }

    async load(): Promise<boolean> {
        const tileSet = await Aws.tileMetadata.TileSet.get(this.name, this.projection, this.tag);
        if (tileSet == null) return false;
        this.tileSet = tileSet;
        this.imagery = await Aws.tileMetadata.Imagery.getAll(this.tileSet);
        return true;
    }

    async getTiffsForQuadKey(qk: string, zoom: number): Promise<CogTiff[]> {
        const output: CogTiff[] = [];
        for (const obj of this.imagery) {
            if (zoom > (obj.rule.maxZoom ?? 32)) continue;
            if (zoom < (obj.rule.minZoom ?? 0)) continue;

            for (const tiff of this.getCogsForQuadKey(obj.imagery, qk)) {
                output.push(tiff);
            }
        }
        return output;
    }

    private getCogsForQuadKey(record: TileMetadataImageryRecord, qk: string): CogTiff[] {
        const output: CogTiff[] = [];
        for (const quadKey of record.quadKeys) {
            if (!QuadKey.intersects(quadKey, qk)) continue;

            const tiffKey = `${record.id}_${quadKey}`;
            let existing = this.sources.get(tiffKey);
            if (existing == null) {
                existing = new CogTiff(new CogSourceAwsS3(this.bucket, TileSet.BasePath(record, quadKey)));
                this.sources.set(tiffKey, existing);
            }

            output.push(existing);
        }
        return output;
    }
}
