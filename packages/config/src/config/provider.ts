import { WmtsProvider } from '@basemaps/geo';
import { VersionedConfig } from './base';

export type ConfigProvider = WmtsProvider & VersionedConfig;
