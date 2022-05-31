export enum ConfigPrefix {
  Imagery = 'im',
  TileSet = 'ts',
  Provider = 'pv',
  ImageryRule = 'ir',
  Style = 'st',
  ProcessingJob = 'pj',
  /** Configuration bundled into a single file */
  ConfigBundle = 'cb',
}

export const ConfigPrefixes: Set<ConfigPrefix> = new Set(Object.values(ConfigPrefix));
