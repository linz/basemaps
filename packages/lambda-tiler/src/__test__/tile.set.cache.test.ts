import { Epsg, GoogleTms } from '@basemaps/geo';
import { TileMetadataImageryRecord, TileSetName } from '@basemaps/shared';
import o from 'ospec';
import { TileSet } from '../tile.set';
import { loadTileSet, loadTileSets, TileSets } from '../tile.set.cache';

o.spec('TileSetCache', () => {
    const origLoad = TileSet.prototype.load;

    const imageOne = {
        id: 'im_id1',
        name: 'tasman_rural_2018-19_0-3m',
        bounds: { x: 123, y: 456, width: 200, height: 300 },
        files: [{ name: 'foo', x: 123, y: 456, width: 200, height: 300 }],
        uri: 's3://foo/bar',
    } as TileMetadataImageryRecord;

    class MyTileSet extends TileSet {
        async load(): Promise<boolean> {
            if (this.projection === Epsg.Google && this.name === TileSetName.aerial) {
                this.tileSet = {
                    title: 'parent aerial title',
                    name: 'aerial',
                    background: { r: 200, g: 50, b: 100, alpha: 0.5 },
                    rules: [
                        { ruleId: 'ir_1', imgId: 'im_id1', minZoom: 10, maxZoom: 31, priority: 2000 },
                        { ruleId: 'ir_2', imgId: 'im_id2', minZoom: 8, maxZoom: 21, priority: 1000 },
                    ],
                } as any;

                this.imagery = new Map();
                this.imagery.set(imageOne.id, imageOne);
                this.imagery.set('im_id2', {
                    id: 'im_id2',
                    name: 'sub image 2',
                    bounds: { x: 1230, y: 4560, width: 2000, height: 3000 },
                } as TileMetadataImageryRecord);
                return true;
            }
            if (this.projection === Epsg.Nztm2000 && this.name === TileSetName.aerial) {
                this.tileSet = {
                    background: { r: 200, g: 50, b: 100, alpha: 0.5 },
                    name: TileSetName.aerial,
                    rules: [{ ruleId: 'ir_3', imgId: 'im_id3', minZoom: 10, maxZoom: 31, priority: 2000 }],
                } as any;
                this.imagery = new Map();
                this.imagery.set('im_id3', {
                    id: 'im_id3',
                    name: 'tasman_rural_2018-19_0-3m',
                    bounds: { x: 321, y: 654, width: 250, height: 220 },
                } as TileMetadataImageryRecord);

                return true;
            }
            return false;
        }
    }

    o.afterEach(() => {
        TileSets.clear();
        TileSet.prototype.load = origLoad;
    });

    o.spec('loadTileSet', () => {
        o('load individual set', async () => {
            const loadSpy = o.spy(MyTileSet.prototype.load);
            (TileSet.prototype.load as any) = loadSpy;
            TileSets.set('ts1', new TileSet('aerial@head', Epsg.Google));

            const parentTileSet = await loadTileSet('aerial@head', Epsg.Google);

            if (parentTileSet == null) throw new Error('null parentTileSet');

            const subTileSet = await loadTileSet('aerial@head:tasman_rural_2018-19_0-3m', Epsg.Google);

            if (subTileSet == null) throw new Error('null subTileSet');

            o(subTileSet.title).equals('parent aerial title Tasman rural 2018-19 0.3m');
            o(subTileSet.name).equals('id1');
            o([...subTileSet.imagery.values()]).deepEquals([imageOne]);
            const [firstRule] = subTileSet.tileSet.rules;
            o(firstRule).deepEquals({
                ruleId: firstRule.ruleId as any,
                imgId: 'im_id1',
                minZoom: 0,
                maxZoom: 100,
                priority: 0,
            });
            o(subTileSet.background).equals(undefined);

            o(parentTileSet.tileSet.background).deepEquals({ r: 200, g: 50, b: 100, alpha: 0.5 });
            o(parentTileSet.tileSet.background).equals(Object.getPrototypeOf(subTileSet.tileSet).background);

            const noTiffs = subTileSet.getTiffsForTile(GoogleTms, { x: 0, y: 0, z: 1 });
            o(noTiffs).deepEquals([]);

            const aTiff = subTileSet.getTiffsForTile(GoogleTms, { x: 0, y: 0, z: 0 });
            o(aTiff.length).equals(1);
            o(aTiff[0].source.uri).equals('s3://foo/bar/foo.tiff');
        });
    });

    o.spec('loadTileSets', () => {
        o('load all', async () => {
            const loadSpy = o.spy(MyTileSet.prototype.load);
            (TileSet.prototype.load as any) = loadSpy;
            const ts1 = new TileSet('aerial', Epsg.Google);
            TileSets.set('ts1', ts1);
            const tileSets = await loadTileSets('', null);

            o(tileSets.length).deepEquals(4);

            o(tileSets[0].title).equals(TileSetName.aerial);
            o(tileSets[0].name).equals(TileSetName.aerial);
            o(tileSets[0].projection.code).equals(2193);
            o(tileSets[0].extent.toBbox()).deepEquals([274000, 3087000, 3327000, 7173000]);

            o(tileSets[1].title).equals('parent aerial title');
            o(tileSets[1].name).equals('aerial');
            o(tileSets[1].background).deepEquals({ r: 200, g: 50, b: 100, alpha: 0.5 });
            o(tileSets[1].imagery.get('im_id1')?.name).equals('tasman_rural_2018-19_0-3m');

            o(tileSets[2].title).equals('parent aerial title Sub image 2');
            o(tileSets[2].name).equals('aerial:sub image 2');
            o([...tileSets[2].imagery.values()]).deepEquals([
                {
                    id: 'im_id2',
                    name: 'sub image 2',
                    bounds: { x: 1230, y: 4560, width: 2000, height: 3000 },
                } as TileMetadataImageryRecord,
            ]);

            o(tileSets[3].title).equals('parent aerial title Tasman rural 2018-19 0.3m');
            o(tileSets[3].name).equals('aerial:tasman_rural_2018-19_0-3m');
            o(tileSets[3].background).equals(undefined);
            o([...tileSets[3].imagery.values()]).deepEquals([imageOne]);

            o(tileSets[3].extent.toBbox()).deepEquals([123, 456, 323, 756]);
        });

        o('load all subset projections', async () => {
            const loadSpy = o.spy(MyTileSet.prototype.load);
            (TileSet.prototype.load as any) = loadSpy;
            const ts1 = new TileSet('aerial@head', Epsg.Google);
            TileSets.set('ts1', ts1);
            const tileSets = await loadTileSets('aerial@head:tasman_rural_2018-19_0-3m', null);

            o(tileSets.length).deepEquals(2);

            o(tileSets[0].name).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o(tileSets[0].projection).equals(Epsg.Nztm2000);
            o(tileSets[1].name).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o(tileSets[1].projection).equals(Epsg.Google);
        });

        o('load all @tag', async () => {
            const loadSpy = o.spy(MyTileSet.prototype.load);
            (TileSet.prototype.load as any) = loadSpy;
            const ts1 = new TileSet('aerial@head', Epsg.Google);
            TileSets.set('ts1', ts1);
            const tileSets = await loadTileSets('@head', null);

            o(tileSets.length).deepEquals(4);

            o(tileSets[0].name).equals(TileSetName.aerial);
            o(tileSets[1].name).equals('aerial');
            o(tileSets[2].name).equals('aerial@head:sub image 2');
            o(tileSets[3].name).equals('aerial@head:tasman_rural_2018-19_0-3m');
        });
    });
});
