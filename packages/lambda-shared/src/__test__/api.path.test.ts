import { EPSG } from '@basemaps/geo';
import * as o from 'ospec';
import { tileFromPath, TileSetType, TileType } from '../api.path';
import { LambdaContext } from '../lambda.context';
import { LogConfig } from '../log';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('api.path', () => {
    function makeContext(path: string): LambdaContext {
        return new LambdaContext({ path } as any, LogConfig.get());
    }

    o('should extract action', () => {
        const ctx = makeContext('/v2/the-action/rest/of/path');

        o(ctx.action.version).equals('v2');
        o(ctx.action.name).equals('the-action');
        o(ctx.action.rest).deepEquals('rest/of/path'.split('/'));
    });

    o('should default to version 1', () => {
        const ctx = makeContext('/ping');

        o(ctx.action.version).equals('v1');
        o(ctx.action.name).equals('ping');
        o(ctx.action.rest).deepEquals([]);
    });

    o.spec('tileFromPath', () => {
        o('should return null if invalid', () => {
            const ctx = makeContext('/v1/tiles/aerial/global-mercator/1/2/3/4.png');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).equals(null);
        });

        o('should extract variables', () => {
            const ctx = makeContext('/v1/tiles/aerial/global-mercator/1/2/3.png');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).deepEquals({
                type: TileType.Image,
                tileSet: TileSetType.aerial,
                projection: EPSG.Google,
                x: 2,
                y: 3,
                z: 1,
                ext: 'png',
            });
        });

        o('should extract WMTSCapabilities for tileSet and projection', () => {
            const ctx = makeContext('/v1/tiles/aerial/global-mercator/WMTSCapabilities.xml');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                tileSet: TileSetType.aerial,
                projection: EPSG.Google,
            });
        });

        o('should extract WMTSCapabilities for tileSet', () => {
            const ctx = makeContext('/v1/tiles/aerial/WMTSCapabilities.xml');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                tileSet: TileSetType.aerial,
                projection: null,
            });
        });
    });
});
