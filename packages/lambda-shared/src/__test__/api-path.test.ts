import * as o from 'ospec';
import { extractAction } from '../api-path';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('api-path', () => {
    o('should extract action', () => {
        const myInfo: any = {
            urlPath: '/v2/the-action/rest/of/path',
        };
        extractAction(myInfo);

        o(myInfo.version).equals('v2');
        o(myInfo.action).equals('the-action');
        o(myInfo.rest).deepEquals('rest/of/path'.split('/'));
    });

    o('should default to version 1', () => {
        const myInfo: any = {
            urlPath: '/ping',
        };
        extractAction(myInfo);

        o(myInfo.version).equals('v1');
        o(myInfo.action).equals('ping');
        o(myInfo.rest).deepEquals([]);
    });
});
