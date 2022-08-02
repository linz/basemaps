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
    name: 'health-2193-z3',
    tileMatrix: TileMatrixIdentifier.Nztm2000Quad,
    location: { lat: -41.8899962, lng: 174.0492437, z: 3 },
    tileSet: 'aerial',
  },
  {
    name: 'aerial-3857-wellington-urban-z16',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -41.2890657, lng: 174.7769262, z: 16 },
    tileSet: 'aerial',
  },
  {
    name: 'aerial-3857-canterbury-rural-z12',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -43.4040409, lng: 172.5393086, z: 12 },
    tileSet: 'aerial',
  },
  {
    name: 'topographic-3857-z8',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -39.2169833, lng: 176.4774344, z: 8 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topolite-3857-z8',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -39.2169833, lng: 176.4774344, z: 8 },
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
    name: 'topographic-3857-auckland-airport-z13',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -37.000845, lng: 174.8064383, z: 13 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topographic-3857-otaki-south-z13',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -40.7727954, lng: 175.1504838, z: 13 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topographic-3857-christchurch-north-urban-z17',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -43.4567506, lng: 172.6109426, z: 17 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topographic-3857-mount-cook-village-z12',
    tileMatrix: TileMatrixIdentifier.Google,
    location: { lat: -43.717227, lng: 170.0844837, z: 17 },
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
