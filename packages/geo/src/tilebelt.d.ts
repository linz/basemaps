declare module '@mapbox/tilebelt' {
    export function pointToTile(lon: number, lat: number, z: number): [number, number, number];
    export function tileToBBOX(tile: [number, number, number]): [number, number, number, number];
    export function tileToQuadkey(tile: [number, number, number]): string;
    export function quadkeyToTile(quadkey: string): [number, number, number];
}
