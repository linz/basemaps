import * as o from 'ospec';
import { populateAction, tileFromPath, TileType, TileSetType } from '../api-path';
import { EPSG } from '@basemaps/geo';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('api-path', () => {
    o('should extract action', () => {
        const myInfo: any = {
            urlPath: '/v2/the-action/rest/of/path',
        };
        populateAction(myInfo);

        o(myInfo.version).equals('v2');
        o(myInfo.action).equals('the-action');
        o(myInfo.rest).deepEquals('rest/of/path'.split('/'));
    });

    o('should default to version 1', () => {
        const myInfo: any = {
            urlPath: '/ping',
        };
        populateAction(myInfo);

        o(myInfo.version).equals('v1');
        o(myInfo.action).equals('ping');
        o(myInfo.rest).deepEquals([]);
    });

    o.spec('tileFromPath', () => {
        o('should return null if invalid', () => {
            const myInfo: any = {
                urlPath: '/v1/tiles/aerial/global-mercator/1/2/3/4.png',
            };
            populateAction(myInfo);

            const ans = tileFromPath(myInfo.rest);

            o(ans).equals(null);
        });

        o('should extract variables', () => {
            const myInfo: any = {
                urlPath: '/v1/tiles/aerial/global-mercator/1/2/3.png',
            };
            populateAction(myInfo);

            const ans = tileFromPath(myInfo.rest);

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
            const myInfo: any = {
                urlPath: '/v1/tiles/aerial/global-mercator/WMTSCapabilities.xml',
            };
            populateAction(myInfo);

            const ans = tileFromPath(myInfo.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                tileSet: TileSetType.aerial,
                projection: EPSG.Google,
            });
        });

        o('should extract WMTSCapabilities for tileSet', () => {
            const myInfo: any = {
                urlPath: '/v1/tiles/aerial/WMTSCapabilities.xml',
            };
            populateAction(myInfo);

            const ans = tileFromPath(myInfo.rest);

            o(ans).deepEquals({
                type: TileType.WMTS,
                tileSet: TileSetType.aerial,
                projection: null,
            });
        });
    });
});
