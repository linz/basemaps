import { EPSG, QuadKey } from '@basemaps/geo';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import * as path from 'path';
import {
    Aws,
    TileMetadataSetRecord,
    TileMetadataImageryRecord,
    Env,
    TileMetadataImageRule,
    TileMetadataTable,
    RecordPrefix,
    TileSetTag,
} from '@basemaps/lambda-shared';

export class TileSet {
    name: string;
    tag: TileSetTag;
    projection: EPSG;
    tileSet: TileMetadataSetRecord;
    imagery: Map<string, TileMetadataImageryRecord>;
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
        this.tag = tag ?? TileSetTag.Production;
        this.projection = projection;

        if (bucket == null) throw new Error(`Invalid environment missing "${Env.CogBucket}"`);
        this.bucket = bucket;
    }

    get id(): string {
        return `${this.name}_${this.projection}`;
    }

    async load(): Promise<void> {
        this.tileSet = await Aws.tileMetadata.TileSet.get(this.name, this.projection, this.tag);
        this.imagery = await Aws.tileMetadata.Imagery.getAll(this.tileSet);
    }

    *allImagery(): Generator<{ rule: TileMetadataImageRule; imagery: TileMetadataImageryRecord }> {
        for (const rule of this.tileSet.imagery) {
            const imagery = this.imagery.get(rule.id);
            if (imagery == null) throw new Error(`Unable to find imagery for key: ${rule.id}`);

            yield { rule, imagery };
        }
    }

    async getTiffsForQuadKey(qk: string, zoom: number): Promise<CogTiff[]> {
        const output: CogTiff[] = [];
        for (const rule of this.tileSet.imagery) {
            if (zoom > (rule.maxZoom ?? 32)) continue;
            if (zoom < (rule.minZoom ?? 0)) continue;

            const source = this.imagery.get(rule.id);
            if (source == null) continue;

            for (const tiff of this.getCogsForQuadKey(source, qk)) {
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
