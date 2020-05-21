import * as o from 'ospec';
import { TileMetadataTag, TileMetadataProviderRecord } from '../tile.metadata.base';
import { TileMetadataProvider } from '../tile.metadata.provider';

o.spec('tile.metadata.provider', () => {
    const metadata = {} as any;
    const pv = new TileMetadataProvider(metadata);

    o.beforeEach(() => {
        metadata.get = o.spy();
        metadata.put = o.spy();
    });

    o('get', async () => {
        const rec1 = {} as TileMetadataProviderRecord;
        const recGet = o.spy(() => rec1);
        metadata.get = recGet;
        const ans = await pv.get(TileMetadataTag.Production);
        o(ans).equals(rec1);

        o(recGet.args as any).deepEquals(['pv_main_production']);
    });

    o('tag', async () => {
        const v1 = { id: 'pv_main_v000001' } as TileMetadataProviderRecord;
        metadata.get = (): TileMetadataProviderRecord => v1;
        const rec = await pv.tag(TileMetadataTag.Beta, 1);

        o(rec).equals(v1);

        o(v1.id).equals('pv_main_beta');
    });

    o.spec('id', () => {
        o('should create version ids', () => {
            o(pv.id(5)).equals('pv_main_v000005');
            o(pv.id(32)).equals('pv_main_v000032');
            o(pv.id(Number.MAX_SAFE_INTEGER)).equals('pv_main_v9007199254740991');
        });

        o('should create tag ids', () => {
            o(pv.id(TileMetadataTag.Production)).equals('pv_main_production');
            o(pv.id(TileMetadataTag.Head)).equals('pv_main_head');
            o(pv.id(TileMetadataTag.Beta)).equals('pv_main_beta');
        });
    });
});
