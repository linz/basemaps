import { Nztm2000Tms } from '@basemaps/geo';
import { LogConfig, TileDataXyz, TileType } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { LambdaContext } from '../lambda.context';
import { LambdaHttpResponse } from '../lambda.response';
import { ValidateTilePath } from '../validate.path';

o.spec('ValidateTilePath', () => {
    let xyzData: TileDataXyz;
    let ctx: LambdaContext;
    o.beforeEach(() => {
        ctx = new LambdaContext({} as any, LogConfig.get());
        xyzData = {
            x: 0,
            y: 0,
            z: 0,
            name: 'aerial',
            tileMatrix: Nztm2000Tms,
            type: TileType.Tile,
            ext: ImageFormat.JPEG,
        };
    });

    o('should validate and set context', () => {
        ValidateTilePath.validate(ctx, xyzData);
        o(ctx.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(ctx.logContext['projection']).equals(2193);
        o(ctx.logContext['tileSet']).equals('aerial');
        o(ctx.logContext['extension']).equals('jpeg');
    });

    [
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z: 30 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 100, y: 0, z: 0 },
        { x: 0, y: 100, z: 0 },
    ].forEach((xyz) => {
        o(`should 404 for invalid ${JSON.stringify(xyz)}`, () => {
            xyzData.x = xyz.x;
            xyzData.y = xyz.y;
            xyzData.z = xyz.z;
            o(() => ValidateTilePath.validate(ctx, xyzData)).throws(LambdaHttpResponse);
        });
    });
});
