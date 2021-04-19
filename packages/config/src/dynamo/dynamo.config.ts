import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Epsg, EpsgCode } from '@basemaps/geo';
import { BaseConfig } from '../config/base';
import { ConfigImagery } from '../config/imagery';
import { ConfigPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigTag } from '../config/tag';
import { ConfigTileSet, ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';
import { ConfigDynamoCached } from './dynamo.config.cached';
import { ConfigDynamoVersioned } from './dynamo.config.versioned';

export class ConfigDynamo {
    Prefix = ConfigPrefix;
    Tag = ConfigTag;

    dynamo: DynamoDB;
    tableName: string;

    Imagery = new ConfigDynamoCached<ConfigImagery>(this, ConfigPrefix.Imagery);
    Style = new ConfigDynamoVectorStyle(this, ConfigPrefix.Style);
    TileSet = new ConfigDynamoTileSet(this, ConfigPrefix.TileSet);
    Provider = new ConfigDynamoProvider(this, ConfigPrefix.Provider);

    constructor(tableName: string) {
        this.dynamo = new DynamoDB({});
        this.tableName = tableName;
    }

    /**
     * Prefix a dynamoDb id with the provided prefix if it doesnt already start with it.
     */
    prefix(prefix: ConfigPrefix, id: string): string {
        if (id === '') return id;
        if (id.startsWith(prefix)) return id;
        return `${prefix}_${id}`;
    }

    /**
     * Remove the prefix from a dynamoDb id
     */
    unprefix(prefix: ConfigPrefix, id: string): string {
        if (id.startsWith(prefix)) return id.substr(3);
        return id;
    }

    record(): BaseConfig {
        const now = Date.now();
        return {
            id: '',
            createdAt: now,
            updatedAt: now,
        };
    }
}

export class ConfigDynamoProvider extends ConfigDynamoVersioned<ConfigProvider> {
    id(record: { name: string }, version: string | number): string {
        return super._id([record.name], version);
    }
}

export class ConfigDynamoTileSet extends ConfigDynamoVersioned<ConfigTileSet> {
    isRaster(x: ConfigTileSet | null | undefined): x is ConfigTileSetRaster {
        if (x == null) return false;
        return x.type == null || x.type === TileSetType.Raster;
    }

    isVector(x: ConfigTileSet | null | undefined): x is ConfigTileSetVector {
        if (x == null) return false;
        return x.type === TileSetType.Vector;
    }

    id(record: { name: string; projection: Epsg | EpsgCode }, version: string | number): string {
        if (typeof record.projection === 'number') return super._id([record.name, String(record.projection)], version);
        return super._id([record.name, String(record.projection.code)], version);
    }

    /**
     * Sort the render rules of a tile set given the information about the imagery
     *
     * This sorts the `tileSet.rules` array to be in the order of first is the highest priority imagery to layer
     *
     * @param tileSet with rules that need to be sorted
     * @param imagery All imagery referenced inside the tileset
     */
    sortRenderRules(tileSet: ConfigTileSetRaster, imagery: Map<string, ConfigImagery>): void {
        tileSet.rules.sort((ruleA, ruleB) => {
            if (ruleA.priority !== ruleB.priority) return ruleA.priority - ruleB.priority;
            const imgA = imagery.get(ruleA.imgId);
            const imgB = imagery.get(ruleB.imgId);
            if (imgA == null || imgB == null) throw new Error('Unable to find imagery to sort');

            return this.compareImageSets(imgA, imgB);
        });
    }
    /**
     * Imagery sort must be stable, otherwise the ordering of imagery sets will vary between tile
     * renders, causing weird artifacts in the map
     */
    compareImageSets(ai: ConfigImagery, bi: ConfigImagery): number {
        // Sort by year, newest on top
        if (ai.year !== bi.year) return ai.year - bi.year;

        // Resolution, highest resolution (lowest number) on top
        if (ai.resolution !== bi.resolution) return bi.resolution - ai.resolution;

        // If everything is equal use the name to force a stable sort
        return ai.id.localeCompare(bi.id);
    }

    getImagery(rec: ConfigTileSetRaster): Promise<Map<string, ConfigImagery>> {
        return this.cfg.Imagery.getAll(new Set(rec.rules.map((r) => r.imgId)));
    }
}

export class ConfigDynamoVectorStyle extends ConfigDynamoVersioned<ConfigVectorStyle> {
    id(record: { name: string }, version: string | number): string {
        return super._id([record.name], version);
    }
}
