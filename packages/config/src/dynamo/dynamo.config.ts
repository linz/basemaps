import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Epsg, EpsgCode } from '@basemaps/geo';
import { BaseConfig } from '../config/base';
import { ConfigImagery } from '../config/imagery';
import { ConfigPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigLayer, ConfigTileSet, ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';
import { ConfigDynamoCached } from './dynamo.config.cached';

export class ConfigDynamo {
    Prefix = ConfigPrefix;

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

export class ConfigDynamoProvider extends ConfigDynamoCached<ConfigProvider> {}

export class ConfigDynamoImagery extends ConfigDynamoCached<ConfigImagery> {
    async getImagery(layer: ConfigLayer, projection: Epsg): Promise<ConfigImagery | null> {
        if (projection.code === EpsgCode.Nztm2000 && layer[2193]) return this.get(this.id(layer[2193]));
        if (projection.code === EpsgCode.Google && layer[3857]) return this.get(this.id(layer[3857]));
        return null;
    }

    async getAllImagery(layers: ConfigLayer[], projection: Epsg): Promise<Map<string, ConfigImagery>> {
        const imagery: Map<string, ConfigImagery> = new Map<string, ConfigImagery>();

        // Get Imagery based on the order of rules. Imagery priority are ordered by on rules.
        for (const layer of layers) {
            if (projection.code === EpsgCode.Nztm2000 && layer[2193]) {
                const configImg = await this.get(this.id(layer[2193]));
                if (configImg == null) continue;
                imagery.set(layer[2193], configImg);
            }

            if (projection.code === EpsgCode.Google && layer[3857]) {
                const configImg = await this.get(this.id(layer[3857]));
                if (configImg == null) continue;
                imagery.set(layer[3857], configImg);
            }
        }
        return imagery;
    }
}

export class ConfigDynamoTileSet extends ConfigDynamoCached<ConfigTileSet> {
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
        for (const layer of rec.layers) {
            if (layer[2193] != null) imgIds.add(layer[2193]);
            if (layer[3857] != null) imgIds.add(layer[3857]);
        }
        return this.cfg.Imagery.getAll(imgIds);
    }

    getImageId(layer: ConfigLayer, projection: Epsg): string | undefined {
        if (projection.code === EpsgCode.Nztm2000) return layer[2193];
        if (projection.code === EpsgCode.Google) return layer[3857];
        return undefined;
    }
}

export class ConfigDynamoVectorStyle extends ConfigDynamoCached<ConfigVectorStyle> {}
