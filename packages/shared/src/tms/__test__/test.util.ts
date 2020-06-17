import { NamedBounds } from '../../aws/tile.metadata.base';
import { ProjectionTileMatrixSet } from '../projection.tile.matrix.set';
import { EpsgCode, QuadKey, TileMatrixSet } from '@basemaps/geo';

export function qkToName(qk: string): string {
    return TileMatrixSet.tileToName(QuadKey.toTile(qk));
}

export function qkToNamedBounds(
    quadKeys: string[],
    proj = ProjectionTileMatrixSet.get(EpsgCode.Google),
): NamedBounds[] {
    const { tms } = proj;
    return quadKeys.map((qk) => Object.assign({ name: qkToName(qk) }, tms.tileToSourceBounds(QuadKey.toTile(qk))));
}
