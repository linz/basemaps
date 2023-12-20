export enum ConfigPrefix {
  /** Prefix for imagery {@link ConfigImagery} */
  Imagery = 'im',
  /** Prefix for tile sets {@link ConfigTileSet} */
  TileSet = 'ts',
  /** Prefix for provider {@link ConfigProvider} */
  Provider = 'pv',
  /** Prefix for style {@link ConfigVectorStyle} */
  Style = 'st',
  /** Configuration bundled into a single file {@link ConfigBundle} */
  ConfigBundle = 'cb',
}

export const ConfigPrefixes: Set<ConfigPrefix> = new Set(Object.values(ConfigPrefix));
