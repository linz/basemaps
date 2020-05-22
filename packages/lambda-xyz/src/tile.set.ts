import { EPSG, QuadKey } from '@basemaps/geo';
import {
    Aws,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataTag,
    TileSetRuleImagery,
} from '@basemaps/lambda-shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';

export class TileSet {
    name: string;
    tag: TileMetadataTag;
    projection: EPSG;
    private tileSet: TileMetadataSetRecord;
    imagery: TileSetRuleImagery[];
    sources: Map<string, CogTiff> = new Map();

    /**
     * Return the location of a imagery `record`
     * @param record
     * @param quadKey the COG to locate. Return just the directory if `null`
     */
    static basePath(record: TileMetadataImageryRecord, quadKey?: string): string {
        if (quadKey == null) {
            return record.uri;
        }
        if (record.uri.endsWith('/')) {
            throw new Error("Invalid uri ending with '/' " + record.uri);
        }
        return `${record.uri}/${quadKey}.tiff`;
    }

    constructor(nameStr: string, projection: EPSG) {
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
                existing = new CogTiff(CogSourceAwsS3.createFromUri(TileSet.basePath(record, quadKey))!);
                this.sources.set(tiffKey, existing);
            }

            output.push(existing);
        }
        return output;
    }
}
