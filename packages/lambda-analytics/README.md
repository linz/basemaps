# @basemaps/lambda-analytics


Generate analytics from CloudFront distribution statistics

Every hour this lambda function runs and generates a rolled up summary of usage by API Key

The analytics generated are grouped by API key and the following data is calculated
```typescript
export interface TileRequestStats {
    /** Time of the rollup */
    timestamp: string;
    /** Api Key used */
    api: string;
    /** Type of api key (first character generally `c` for client generated or `d` for developer) */
    apiType: string;
    /** Total number of hits */
    total: 0;
    /** Cache stats as given by cloudfront */
    cache: { hit: 0; miss: 0 };
    /** Status codes given by cloudfront */
    status: Record<number, number>;
    /** Tile exensions used */
    extension: { webp: 0; jpeg: 0; png: 0; wmts: 0; other: 0 };
    /** Projections used */
    projection: { 2193: 0; 3857: 0 };
    /** Tilesets accessed */
    tileSet: { aerial: 0; aerialIndividual: 0; topo50: 0; direct: 0 };
    /** How was this rollup generated */
    generated: { 
        timestamp: string; 
        /** Rollup version */
        v: number; 
        /** Git commit hash used */
        hash?: string; 
        /** Git Version used */
        version?: string 
    };
}
```