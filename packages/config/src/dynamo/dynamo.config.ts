import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Epsg, EpsgCode } from '@basemaps/geo';
import { BaseConfig } from '../config/base';
import { ConfigImagery } from '../config/imagery';
import { ConfigPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigTag } from '../config/tag';
import {
    ConfigImageryRule,
    ConfigTileSet,
    ConfigTileSetRaster,
    ConfigTileSetVector,
    TileSetType,
} from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';
import { ConfigDynamoCached } from './dynamo.config.cached';
import { ConfigDynamoVersioned } from './dynamo.config.versioned';

export class ConfigDynamo {
    Prefix = ConfigPrefix;
    Tag = ConfigTag;

    dynamo: DynamoDB;
    tableName: string;

    Imagery = new ConfigDynamoImagery(this, ConfigPrefix.Imagery);
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
            name: '',
            createdAt: now,
            updatedAt: now,
        };
    }
}

export class ConfigDynamoProvider extends ConfigDynamoVersioned<ConfigProvider> {}

export class ConfigDynamoImagery extends ConfigDynamoCached<ConfigImagery> {
    async getImagery(rule: ConfigImageryRule, projection: Epsg): Promise<ConfigImagery | null> {
        if (projection.code === EpsgCode.Nztm2000 && rule.img2193) return this.get(rule.img2193);
        if (projection.code === EpsgCode.Google && rule.img3857) return this.get(rule.img3857);
        return null;
    }

    async getAllImagery(rules: ConfigImageryRule[], projection: Epsg): Promise<Map<string, ConfigImagery>> {
        const imagery: Map<string, ConfigImagery> = new Map<string, ConfigImagery>();

        // Get Imagery based on the order of rules. Imagery priority are ordered by on rules.
        for (const rule of rules) {
            if (projection.code === EpsgCode.Nztm2000 && rule.img2193) {
                const configImg = await this.get(rule.img2193);
                if (configImg == null) continue;
                imagery.set(rule.img2193, configImg);
            }

            if (projection.code === EpsgCode.Google && rule.img3857) {
                const configImg = await this.get(rule.img3857);
                if (configImg == null) continue;
                imagery.set(rule.img3857, configImg);
            }
        }
        return imagery;
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

    getImagery(rec: ConfigTileSetRaster): Promise<Map<string, ConfigImagery>> {
        const imgIds = new Set<string>();
        for (const rule of rec.rules) {
            if (rule.img2193 != null) imgIds.add(rule.img2193);
            if (rule.img3857 != null) imgIds.add(rule.img3857);
        }
        return this.cfg.Imagery.getAll(imgIds);
    }

    getImageId(rule: ConfigImageryRule, projection: Epsg): string | undefined {
        if (projection.code === EpsgCode.Nztm2000) return rule.img2193;
        if (projection.code === EpsgCode.Google) return rule.img3857;
        return undefined;
    }
}

export class ConfigDynamoVectorStyle extends ConfigDynamoVersioned<ConfigVectorStyle> {}
