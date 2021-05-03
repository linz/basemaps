import o from 'ospec';
import { ConfigDynamo } from '../dynamo.config';

o.spec('ConfigDynamoProvider', () => {
    const Config = new ConfigDynamo('table');

    o.spec('id', () => {
        o('should create ids', () => {
            o(Config.Provider.id('linz')).equals('pv_linz');
        });
    });
});
