import o from 'ospec';
import { ConfigDynamo } from '../dynamo.config';

o.spec('tile.metadata.provider', () => {
    const Config = new ConfigDynamo('table');

    o.spec('id', () => {
        o('should create version ids', () => {
            o(Config.Provider.id({ name: 'main' }, 5)).equals('pv_main_v000005');
            o(Config.Provider.id({ name: 'main' }, 32)).equals('pv_main_v000032');
            o(Config.Provider.id({ name: 'main' }, Number.MAX_SAFE_INTEGER)).equals('pv_main_v9007199254740991');
        });

        o('should create tag ids', () => {
            o(Config.Provider.id({ name: 'main' }, Config.Tag.Production)).equals('pv_main_production');
            o(Config.Provider.id({ name: 'main' }, Config.Tag.Head)).equals('pv_main_head');
        });
    });
});
