import { ConfigDynamo } from './dynamo.config';
import { VersionedConfig } from '../config/base';
import { RecordPrefix } from '../config/prefix';
import { TileMetadataNamedTag, TileMetadataTag } from '../config/tag';
import { ConfigDynamoBase } from './dynamo.config.base';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { ConfigVectorStyle } from '../config/vector.style';

// class CompositeKey<T extends VersionedConfig, K extends {[ keyof T ] : T[K]}> {
//     keys: (keyof K)[];

//     constructor(keys: K) {
//         this.keys = Object.keys(keys) as any;
//     }

//     to(obj: T | K): string {
//         const output: string[] = [];
//         for (const key of this.keys) output.push(String(obj[key]));
//         return output.join('_');
//     }
// }

// function makeId<T extends ConfigVectorStyle, Y extends { [K in keyof T]?: T[K] }>(keys: Y): (f: Y) => null {
//     return (f: any) => {
//         console.log(keys, f);
//         return null;
//     };
// }

// function

// const ck = makeId<ConfigVectorStyle, { tileSetName: string }>({ tileSetName: 'string' });
// ck({ tileSetName: 'asdsad' });
// ck({});
// const cdv = new ConfigDynamoVersioned(null as any, null as any, );

export class ConfigDynamoVersioned<T extends VersionedConfig> extends ConfigDynamoBase<T> {
    keys: (keyof T)[];

    constructor(cfg: ConfigDynamo, prefix: RecordPrefix, keys: (keyof T)[]) {
        super(cfg, prefix);
        this.keys = keys;
    }

    clone(rec: T): T {
        return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as T;
    }

    id(obj: T, version: TileMetadataTag | number): string {
        const output: string[] = [this.prefix];
        for (const k of this.keys) {
            const val = obj[k];
            if (val == null) throw new Error('Cannot create id missing : ' + k);
            output.push(String(obj[k]));
        }

        if (typeof version === 'string') output.push(version);
        else output.push(String(version).padStart(6, '0'));

        return output.join('_');
    }

    async tag(record: T, tag: TileMetadataTag, version: number): Promise<T> {
        if (tag === TileMetadataNamedTag.Head) throw new Error('Cannot overwrite head tag');

        const newVersionId = this.id(record, version);
        const newVersion = await this.get(newVersionId);
        if (newVersion == null) throw new Error(`Cannot find version: ${newVersionId}`);
        newVersion.id = this.id(record, tag);
        await this.put(newVersion);
        return newVersion;
    }

    async create(record: T): Promise<T> {
        const id = this.id(record, TileMetadataNamedTag.Head);

        const v0 = await this.get(id);
        record.revisions = (v0?.revisions ?? -1) + 1;
        record.version = record.revisions;

        // Insert the history record first
        const historyRecord = this.clone(record);
        historyRecord.id = this.id(record, record.revisions);
        await this.put(historyRecord);

        // Update the head to put to the new record
        const headRecord = this.clone(record);
        headRecord.id = this.id(record, TileMetadataNamedTag.Head);
        await this.put(headRecord);

        return headRecord;
    }
}
