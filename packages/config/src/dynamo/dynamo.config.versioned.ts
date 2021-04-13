import { VersionedConfig } from '../config/base';
import { ConfigPrefix } from '../config/prefix';
import { ConfigTag, TileMetadataTag } from '../config/tag';
import { ConfigDynamo } from './dynamo.config';
import { ConfigDynamoBase } from './dynamo.config.base';

export abstract class ConfigDynamoVersioned<T extends VersionedConfig> extends ConfigDynamoBase<T> {
    constructor(cfg: ConfigDynamo, prefix: ConfigPrefix) {
        super(cfg, prefix);
    }

    abstract id<K extends T>(record: K, version: TileMetadataTag | number): string;

    protected _id(id: string[], version: TileMetadataTag | number): string {
        const output: string[] = [this.prefix, ...id];

        if (typeof version === 'string') output.push(version);
        else output.push('v' + String(version).padStart(6, '0'));

        return output.join('_');
    }

    async tag(record: T, tag: TileMetadataTag): Promise<T> {
        if (tag === ConfigTag.Head) throw new Error('Cannot overwrite head tag');

        const newVersion = this.clone(record);
        newVersion.id = this.id(record, tag);
        await this.put(newVersion);
        return newVersion;
    }

    async create(record: T): Promise<T> {
        const id = this.id(record, ConfigTag.Head);

        const v0 = await this.get(id);
        record.revisions = (v0?.revisions ?? -1) + 1;
        record.version = record.revisions;

        // Insert the history record first
        const historyRecord = this.clone(record);
        historyRecord.id = this.id(record, record.revisions);
        await this.put(historyRecord);

        // Update the head to put to the new record
        const headRecord = this.clone(record);
        headRecord.id = this.id(record, ConfigTag.Head);
        await this.put(headRecord);

        return headRecord;
    }
}
