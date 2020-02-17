/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import * as o from 'ospec';

o.spec('AWS Init', (): void => {
    function mock<K extends keyof T, T>(obj: T, key: K, mock: T[K]): Function {
        const old = obj[key];
        obj[key] = mock;
        return () => (obj[key] = old);
    }

    o('should update the aws config', (): void => {
        let opts: any = undefined;
        const unMock = mock(AWS.config, 'update', (o: any) => {
            opts = o;
        });

        require('../index');

        o(opts).notEquals(undefined);
        o(opts['httpOptions']).notEquals(undefined);

        unMock();
    });
});
