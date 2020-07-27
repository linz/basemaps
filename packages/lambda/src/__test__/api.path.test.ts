import { Epsg } from '@basemaps/geo';
import { LogConfig, tileFromPath, TileType } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { LambdaContext } from '../lambda.context';

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

        o('should return null if projection not supported', () => {
            const ctx = makeContext('/v1/tiles/aerial/3793/1/2/3.png');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).equals(null);
        });

        o('should extract variables png', () => {
            const ctx = makeContext('/v1/tiles/aerial/global-mercator/1/2/3.png');

            o(tileFromPath(ctx.action.rest)).deepEquals({
                type: TileType.Image,
                name: 'aerial',
                projection: Epsg.Google,
                x: 2,
                y: 3,
                z: 1,
                ext: ImageFormat.PNG,
            });
        });

        o('should extract variables webp', () => {
            const ctx = makeContext('/v1/tiles/aerial/3857/4/5/6.webp');

            o(tileFromPath(ctx.action.rest)).deepEquals({
                type: TileType.Image,
                name: 'aerial',
                projection: Epsg.Google,
                x: 5,
                y: 6,
                z: 4,
                ext: ImageFormat.WEBP,
            });
        });

        o('should extract WMTSCapabilities for tileSet and projection', () => {
            const ctx = makeContext('/v1/tiles/aerial/global-mercator/WMTSCapabilities.xml');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                name: 'aerial',
                projection: Epsg.Google,
            });
        });

        o('should extract WMTSCapabilities for tileSet', () => {
            const ctx = makeContext('/v1/tiles/aerial/WMTSCapabilities.xml');

            const ans = tileFromPath(ctx.action.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                name: 'aerial',
                projection: null,
            });
        });
    });
});
