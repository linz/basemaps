import { ConfigImagery, ConfigTileSetRaster } from '@basemaps/config';
import { Epsg, GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { Config, TileSetName } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { TileSets } from '../tile.set.cache.js';
import { TileSetRaster } from '../tile.set.raster.js';

o.spec('TileSetCache', () => {
    const sandbox = createSandbox();

    const imageOne = {
        id: 'im_id1',
        name: 'tasman_rural_2018-19_0-3m',
        bounds: { x: 123, y: 456, width: 200, height: 300 },
        files: [{ name: 'foo', x: 123, y: 456, width: 200, height: 300 }],
        uri: 's3://foo/bar',
    } as ConfigImagery;

    const imageTwo = {
        id: 'im_id2',
        name: 'wellington_urban_2018-19_0-3m',
        bounds: { x: 123, y: 456, width: 200, height: 300 },
        files: [{ name: 'foo', x: 123, y: 456, width: 200, height: 300 }],
        uri: 's3://foo/bar',
    } as ConfigImagery;

    const imgMap = new Map<string, ConfigImagery>();
    imgMap.set(imageOne.id, imageOne);

    o.beforeEach(() => {
        sandbox.stub(Config, 'getTileSetImagery').callsFake(async () => {
            const imgMap = new Map<string, ConfigImagery>();
            imgMap.set(imageOne.id, imageOne);
            return imgMap;
        });
    });

    o.afterEach(() => {
        TileSets.cache.clear();
        sandbox.restore();
    });

    o.spec('loadTileSet', () => {
        o('load individual set', async () => {
            TileSets.add(new TileSetRaster('aerial@head', GoogleTms));

            const parentTileSet = await TileSets.get('aerial@head', GoogleTms);
            if (parentTileSet == null || parentTileSet.isVector()) throw new Error('null parentTileSet');
            parentTileSet.imagery = imgMap;
            parentTileSet.tileSet = {
                name: 'parent',
                title: 'parent aerial title',
                background: { r: 200, g: 50, b: 100, alpha: 0.5 },
            } as ConfigTileSetRaster;

            const subTileSet = await TileSets.get('aerial@head:tasman_rural_2018-19_0-3m', GoogleTms);
            if (subTileSet == null || subTileSet.isVector()) throw new Error('null subTileSet');

            o(subTileSet.title).equals('parent aerial title Tasman rural 2018-19 0.3m');
            o(subTileSet.fullName).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o([...subTileSet.imagery.values()]).deepEquals([imageOne]);
            const [firstLayer] = subTileSet.tileSet.layers;
            o(firstLayer).deepEquals({
                name: firstLayer.name,
                [3857]: 'im_id1',
                minZoom: 0,
                maxZoom: 100,
            });
            o(subTileSet.tileSet.background).equals(undefined);

            o(parentTileSet.tileSet.background).deepEquals({ r: 200, g: 50, b: 100, alpha: 0.5 });

            const noTiffs = subTileSet.getTiffsForTile({ x: 0, y: 0, z: 1 });
            o(noTiffs).deepEquals([]);

            const aTiff = subTileSet.getTiffsForTile({ x: 0, y: 0, z: 0 });
            o(aTiff.length).equals(1);
            o(aTiff[0].source.uri).equals('s3://foo/bar/foo.tiff');

            TileSets.cache.delete(subTileSet.id);
            delete parentTileSet.tileSet.title;
            const subTileSetB = await TileSets.get('aerial@head:tasman_rural_2018-19_0-3m', GoogleTms);
            if (subTileSetB == null || subTileSetB.isVector()) throw new Error('null subTileSetB');
            o(subTileSetB.title).equals('parent Tasman rural 2018-19 0.3m');
        });
    });

    o.spec('loadTileSets', () => {
        o('load all', async () => {
            sandbox.stub(Config.TileSet, 'get');

            TileSets.add(new TileSetRaster('aerial', GoogleTms));
            TileSets.add(new TileSetRaster('aerial', Nztm2000Tms));
            const tileSets = await TileSets.getAll('aerial', null);

            o(tileSets.length).deepEquals(2);

            o(tileSets[0].fullName).equals(TileSetName.aerial);
            o(tileSets[0].components.name).equals(TileSetName.aerial);
            o(tileSets[0].tileMatrix.projection.code).equals(3857);

            o(tileSets[1].fullName).equals(TileSetName.aerial);
            o(tileSets[1].components.name).equals(TileSetName.aerial);
            o(tileSets[1].tileMatrix.projection.code).equals(2193);
        });

        o('load all subset projections', async () => {
            sandbox.stub(Config.TileSet, 'get');

            const ts1 = new TileSetRaster('aerial@head', Nztm2000Tms);
            ts1.imagery = imgMap;
            TileSets.add(ts1);
            const ts2 = new TileSetRaster('aerial@head', GoogleTms);
            ts2.imagery = imgMap;
            TileSets.add(ts2);
            const tileSets = await TileSets.getAll('aerial@head:tasman_rural_2018-19_0-3m', null);

            o(tileSets.length).deepEquals(2);

            o(tileSets[0].fullName).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o(tileSets[0].tileMatrix.projection).equals(Epsg.Google);
            o(tileSets[1].fullName).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o(tileSets[1].tileMatrix.projection).equals(Epsg.Nztm2000);
        });

        o('load all @tag', async () => {
            sandbox.stub(Config.TileSet, 'get');
            const imgMap = new Map();
            imgMap.set(imageOne.id, imageOne);
            imgMap.set(imageTwo.id, imageTwo);
            const ts1 = new TileSetRaster('aerial@head', Nztm2000Tms);
            ts1.imagery = imgMap;
            TileSets.add(ts1);

            const tileSets = await TileSets.getAll('aerial@head', null);

            o(tileSets.length).deepEquals(3);

            o(tileSets[0].fullName).equals('aerial@head');
            o(tileSets[1].fullName).equals('aerial@head:tasman_rural_2018-19_0-3m');
            o(tileSets[2].fullName).equals('aerial@head:wellington_urban_2018-19_0-3m');
        });
    });
});
