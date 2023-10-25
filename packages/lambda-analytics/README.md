# @basemaps/lambda-analytics

Generate analytics from CloudFront distribution statistics

Every hour this lambda function runs and generates a rolled up summary of usage by API Key

The analytics generated are grouped by API key and the following data is calculated

```typescript
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
```
