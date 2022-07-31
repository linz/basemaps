import { sha256base58 } from '@basemaps/config';
import { TileMatrixSets } from '@basemaps/geo';

/** Changing this number will cause all the statistics to be recomputed */
export const RollupVersion = 1;
export const CurrentYear = new Date().getUTCFullYear();
export const CacheFolder = `RollUpV${RollupVersion}/${CurrentYear}/`;
export const CacheExtension = '.ndjson';
export const LogStartDate = new Date(`${CurrentYear}-01-01T00:00:00.000Z`);

export interface TileRequestStats {
  /** Unique Id for the time range */
  statId: string;
  /** Time of the rollup */
  timestamp: string;
  /** Api Key used */
  api: string;
  /** Referral uri  */
  referer: string | undefined;
  /** Type of api key (first character generally `c` for client generated or `d` for developer) */
  apiType: string;
  /** Total number of hits */
  total: number;
  /** Cache stats as given by cloudfront */
  cache: { hit: number; miss: number };
  /** Status codes given by cloudfront */
  status: Record<number, number>;
  /** Tile file extensions used */
  extension: { webp: number; jpeg: number; png: number; wmts: number; pbf: number; other: number };
  /** Tile Matrixes used */
  tileMatrix: Record<string, number>;
  /** Tilesets accessed */
  tileSet: Record<string, number>;
  /** Rough approximation of useragent user */
  userAgent: Record<string, number>;
  /** How was this rollup generated */
  generated: { v: number; hash?: string; version?: string };
}

function newStat(timestamp: string, api: string, referer: string): TileRequestStats {
  return {
    statId: timestamp + '_' + sha256base58(`${api}_${referer}`),
    timestamp,
    api,
    referer,
    apiType: api.charAt(0),
    total: 0,
    status: {},
    cache: { hit: 0, miss: 0 },
    extension: { webp: 0, jpeg: 0, png: 0, wmts: 0, pbf: 0, other: 0 },
    tileSet: {},
    userAgent: {},
    tileMatrix: {},
    generated: {
      v: RollupVersion,
      hash: process.env.GIT_HASH,
      version: process.env.GIT_VERSION,
    },
  };
}

function track(stat: TileRequestStats, userAgent: string, uri: string, status: number, isHit: boolean): void {
  stat.total++;

  if (isHit) stat.cache.hit++;
  else stat.cache.miss++;

  stat.status[status] = (stat.status[status] ?? 0) + 1;
  // Process only /v1/tile requests ignoring things like assests (index.html, js, css)
  if (!uri.startsWith('/v1/tiles')) return;

  // Extension
  if (uri.endsWith('.webp')) stat.extension.webp++;
  else if (uri.endsWith('.jpeg') || uri.endsWith('.jpg')) stat.extension.jpeg++;
  else if (uri.endsWith('.png')) stat.extension.png++;
  else if (uri.endsWith('.pbf')) stat.extension.pbf++;
  else if (uri.endsWith('.xml')) {
    stat.extension.wmts++;
  } else stat.extension.other++;

  const [, , , tileSet, projectionStr] = uri.split('/');
  // no projection means this url is weirdly formatted
  if (projectionStr == null) return;

  const tileMatrix = TileMatrixSets.find(projectionStr);
  if (tileMatrix == null) return;

  // Projection
  stat.tileMatrix[tileMatrix.identifier] = (stat.tileMatrix[tileMatrix.identifier] ?? 0) + 1;

  // Tile set
  if (tileSet.startsWith('01')) stat.tileSet['byId'] = (stat.tileSet['byId'] ?? 0) + 1;
  else stat.tileSet[tileSet] = (stat.tileSet[tileSet] ?? 0) + 1;

  stat.userAgent[userAgent] = (stat.userAgent[userAgent] ?? 0) + 1;
}

export class LogStats {
  date: string;
  stats = new Map<string, TileRequestStats>();

  constructor(date: string) {
    this.date = date;
  }

  static ByDate = new Map<string, LogStats>();

  /**
   * Get a log stats by date
   * @param date iso date string
   */
  static getDate(date: string): LogStats {
    const logKey = date.slice(0, 13) + ':00:00.000Z';

    let existing = LogStats.ByDate.get(logKey);
    if (existing == null) {
      existing = new LogStats(logKey);
      LogStats.ByDate.set(logKey, existing);
    }
    return existing;
  }

  getStats(apiKey: string, referer: string): TileRequestStats {
    const statId = `${apiKey}_${referer}`;
    let existing = this.stats.get(statId);
    if (existing == null) {
      existing = newStat(this.date, apiKey, referer);
      this.stats.set(statId, existing);
    }
    return existing;
  }

  track(apiKey: string, referer: string, userAgent: string, uri: string, status: number, isHit: boolean): void {
    track(this.getStats(apiKey, referer), userAgent, uri, status, isHit);
  }
}
