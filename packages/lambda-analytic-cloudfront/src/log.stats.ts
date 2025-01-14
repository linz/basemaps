import { UserAgentInfo } from './useragent/parser.types.js';

export interface LogStats {
  '@timestamp': string;

  /**
   * Cut down API key consisting of the first character and the last 6 characters
   */
  api: string;

  /**
   * API Key type "c" | "d"
   */
  apiType: string;

  /**
   * Raw tile matrix name from the URL
   */
  tileMatrix: string;

  /**
   * Actual tile matrix used
   */
  tileMatrixId: 'NZTM2000Quad' | 'WebMercatorQuad' | 'NZTM2000';

  /**
   * Name of the tile set
   *
   * @example 'aerial' or 'topographic'
   */
  tileSet: string;

  /**
   * zoom level of the request served in WebMercatorQuad zoom scales
   */
  z: number;

  /** Host that referred the request */
  referer: string;

  /** Extension that was served */
  extension: string;

  /** User agent information */
  ua?: UserAgentInfo;
  /**
   * Rendering pipeline if used
   *
   * @example "rgba" or "color-ramp"
   */
  pipeline?: string;
  /**
   * Number of hits that were cache hits
   */
  cacheHit: number;
  /**
   * Number of hits that were cache misses
   */
  cacheMiss: number;
  /**
   * Total number of requests
   */
  total: number;
  /**
   * Total bytes served
   */
  bytes: number;
  /**
   * Total number of tiles that were empty
   */
  empty: number;
  /**
   * Unique ID for the tracking information
   */
  id: string;
}
