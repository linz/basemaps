export interface DebugState {
  debug: boolean;
  /** What color should the background be */
  'debug.background': string | false;
  /** Should the source tiles be shown */
  'debug.source': boolean;
  /** Should the cog outlines be shown */
  'debug.cog': boolean;
  /** Should the capture area be shown */
  'debug.capture-area': boolean;
  /** Should the map tile boundaries be shown */
  'debug.tile': boolean;
  /** Should things be hidden to make a better screenshot */
  'debug.screenshot': boolean;
  /** What opacity is the aerial layer, 0 is off */
  'debug.layer.linz-aerial': number;
  /** What opacity is the topographic layer, 0 is off */
  'debug.layer.linz-topographic': number;
  /** What opacity is the open streetmap layer, 0 is off*/
  'debug.layer.osm': number;
  /** Should the date range slider be shown */
  'debug.date': boolean;
  /** Should the terrain ben shown */
  'debug.terrain': string | null;
  /** What layer should be visible only */
  'debug.layer': string | null;

  /** Should a hillshade be shown */
  'debug.hillshade': string | null;
}

export const DebugDefaults: DebugState = {
  debug: false,
  'debug.background': false,
  'debug.source': false,
  'debug.tile': false,
  'debug.cog': false,
  'debug.capture-area': false,
  'debug.screenshot': false,
  'debug.layer.linz-aerial': 0,
  'debug.layer.linz-topographic': 0,
  'debug.layer.osm': 0,
  'debug.date': false,
  'debug.terrain': null,
  'debug.layer': null,
  'debug.hillshade': null,
};

export class ConfigDebug {
  static toUrl(opt: DebugState, url: URLSearchParams): void {
    if (opt.debug !== true) return;
    url.append('debug', 'true');

    for (const [key, value] of Object.entries(opt)) {
      if (key === 'debug') continue;
      const defaultVal = DebugDefaults[key as keyof DebugState];
      if (defaultVal === value) continue;
      url.append(key, String(value));
    }
  }

  static fromUrl(opt: DebugState, url: URLSearchParams): boolean {
    const isDebug = url.get('debug') != null;
    let isChanged = false;

    if (isDebug === false) {
      // Debug is off reset to default
      for (const [key, value] of Object.entries(DebugDefaults)) {
        isChanged = setKey(opt, key as keyof DebugState, value as string) || isChanged;
      }
      return isChanged;
    }
    isChanged = setKey(opt, 'debug', true);
    isChanged = setKey(opt, 'debug.background', url.get('debug.background')) || isChanged;
    isChanged = setKey(opt, 'debug.tile', url.get('debug.tile') != null) || isChanged;
    isChanged = setKey(opt, 'debug.source', url.get('debug.source') != null) || isChanged;
    isChanged = setKey(opt, 'debug.cog', url.get('debug.cog') != null) || isChanged;
    isChanged = setKey(opt, 'debug.capture-area', url.get('debug.capture-area') != null) || isChanged;
    isChanged = setKey(opt, 'debug.screenshot', url.get('debug.screenshot') != null) || isChanged;
    isChanged = setNum(opt, 'debug.layer.linz-aerial', url.get('debug.layer.linz-aerial')) || isChanged;
    isChanged = setNum(opt, 'debug.layer.linz-topographic', url.get('debug.layer.linz-topographic')) || isChanged;
    isChanged = setNum(opt, 'debug.layer.osm', url.get('debug.layer.osm')) || isChanged;
    isChanged = setKey(opt, 'debug.date', url.get('debug.date') != null) || isChanged;
    isChanged = setKey(opt, 'debug.terrain', url.get('debug.terrain')) || isChanged;
    isChanged = setKey(opt, 'debug.layer', url.get('debug.layer')) || isChanged;
    isChanged = setKey(opt, 'debug.hillshade', url.get('debug.hillshade')) || isChanged;

    return isChanged;
  }
}

function toNum(val: string | null, defaultValue = 0): number {
  if (val == null) return defaultValue;
  const num = Number(val);
  if (isNaN(num)) return defaultValue;
  return num;
}

function setKey<T extends keyof DebugState>(opt: DebugState, key: T, value: DebugState[T] | null): boolean {
  if (value == null) value = DebugDefaults[key];
  if (opt[key] === value) return false;
  opt[key] = value;
  return true;
}

export type DebugKeysNumber = keyof DebugState;
function setNum(opt: DebugState, key: DebugKeysNumber, value: string | null): boolean {
  return setKey(opt, key, toNum(value));
}
