import { TileDataXyz, Projection } from '@basemaps/shared';
import { TileMatrixSets } from '@basemaps/geo';
import { LambdaContext } from './lambda.context';
import { LambdaHttpResponse } from './lambda.response';

export const ValidateTilePath = {
    /**
     * Validate that the tile request is somewhat valid
     * - Valid projection
     * - Valid range
     *
     * @throws LambdaHttpResponse for tile requests that are not valid
     *
     * @param req request to validate
     * @param xyzData
     */
    validate(req: LambdaContext, xyzData: TileDataXyz): void {
        const { x, y, z, ext } = xyzData;
        req.set('xyz', { x, y, z });
        req.set('projection', xyzData.projection.code);
        req.set('extension', ext);
        req.set('tileSet', xyzData.name);

        const tileMatrix = TileMatrixSets.tryGet(xyzData.projection.code);
        if (tileMatrix == null) throw new LambdaHttpResponse(404, `Projection not found: ${xyzData.projection.code}`);
        if (z > tileMatrix.maxZoom || z < 0) throw new LambdaHttpResponse(404, `Zoom not found: ${z}`);

        const zoom = tileMatrix.zooms[z];
        if (x < 0 || x > zoom.matrixWidth) throw new LambdaHttpResponse(404, `X not found: ${x}`);
        if (y < 0 || y > zoom.matrixHeight) throw new LambdaHttpResponse(404, `Y not found: ${y}`);

        const latLon = Projection.tileCenterToLatLon(tileMatrix, xyzData);
        req.set('location', latLon);
    },
};
