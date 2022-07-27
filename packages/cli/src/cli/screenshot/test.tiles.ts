import { z } from 'zod';

enum TileMatrixIdentifier {
  Nztm2000Quad = 'NZTM2000Quad',
  Google = 'WebMercatorQuad',
}

const zLocation = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  z: z.number().gte(0).lte(32),
});

const zTileTest = z.object({
  name: z.string(),
  tileMatrix: z.nativeEnum(TileMatrixIdentifier),
  location: zLocation,
  tileSet: z.string(),
  style: z.string().optional(),
});

export type TileTestSchema = z.infer<typeof zTileTest>;

export const DefaultTestTiles: TileTestSchema[] = [
  {
    name: 'health-3857-z5',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.8899962, lng: 174.0492437, z: 5 },
    tileSet: 'health',
  },
  {
    name: 'health-2193-z5',
    tileMatrix: TileMatrixIdentifier.Nztm2000Quad,
    location: { lat: -41.8899962, lng: 174.0492437, z: 1 },
    tileSet: 'aerial',
  },
  {
    name: 'topographic-3857-z6',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.8899962, lng: 174.0492437, z: 6 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topolite-3857-z6',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.8899962, lng: 174.0492437, z: 6 },
    tileSet: 'topographic',
    style: 'topolite',
  },
  {
    name: 'topographic-3857-z14',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.8899962, lng: 174.0492437, z: 14 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topographic-3857-ngauranga-z15',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.2454458, lng: 174.8101136, z: 15 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topolite-3857-ngauranga-z15',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.2454458, lng: 174.8101136, z: 15 },
    tileSet: 'topographic',
    style: 'topolite',
  },
  {
    name: 'topolite-3857-z17',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -43.8063936, lng: 172.9679876, z: 17 },
    tileSet: 'topographic',
    style: 'topolite',
  },
];
