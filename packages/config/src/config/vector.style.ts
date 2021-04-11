import { VersionedConfig } from './base';

export interface ConfigVectorStyle extends VersionedConfig {
    tileSetName: string;
    style: string;
}
