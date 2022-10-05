import { ConfigProviderDynamo, BasemapsConfigProvider } from '@basemaps/config';
import { Const } from './const.js';

let ConfigDefault: BasemapsConfigProvider = new ConfigProviderDynamo(Const.TileMetadata.TableName);

export function setDefaultConfig(cfg: BasemapsConfigProvider): BasemapsConfigProvider {
  ConfigDefault = cfg;
  return ConfigDefault;
}

export function getDefaultConfig(): BasemapsConfigProvider {
  return ConfigDefault;
}
