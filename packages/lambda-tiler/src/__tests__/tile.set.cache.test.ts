import { ConfigImagery, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { GoogleTms } from '@basemaps/geo';
import o from 'ospec';
import sinon from 'sinon';
import { TileSets } from '../tile.set.cache.js';
import { TileSetRaster } from '../tile.set.raster.js';
const sandbox = sinon.createSandbox();
o.spec('TileSetCache', () => {
  const imageOne = {
    id: 'im_id1',
    name: 'tasman_rural_2018-19_0-3m',
    bounds: { x: 123, y: 456, width: 200, height: 300 },
    files: [{ name: 'foo', x: 123, y: 456, width: 200, height: 300 }],
    uri: 's3://foo/bar',
  } as ConfigImagery;

  const imgMap = new Map<string, ConfigImagery>();
  imgMap.set(imageOne.id, imageOne);

  o.afterEach(() => {
    TileSets.cache.clear();
    sandbox.restore();
  });

  o.spec('loadTileSet', () => {
    o('load individual set', async () => {
      TileSets.add(new TileSetRaster('aerial@head', GoogleTms));

      const parentTileSet = await TileSets.get('aerial@head', GoogleTms);
      if (parentTileSet == null || parentTileSet.type === TileSetType.Vector) throw new Error('null parentTileSet');
      parentTileSet.imagery = imgMap;
      parentTileSet.tileSet = {
        name: 'parent',
        title: 'parent aerial title',
        background: { r: 200, g: 50, b: 100, alpha: 0.5 },
      } as ConfigTileSetRaster;

      const subTileSet = await TileSets.get('aerial@head:tasman_rural_2018-19_0-3m', GoogleTms);
      if (subTileSet == null || subTileSet.type === TileSetType.Vector) throw new Error('null subTileSet');

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
      if (subTileSetB == null || subTileSetB.type === TileSetType.Vector) throw new Error('null subTileSetB');
      o(subTileSetB.title).equals('parent Tasman rural 2018-19 0.3m');
    });

    o('should not throw if child does not exist', async () => {
      TileSets.add(new TileSetRaster('aerial@head', GoogleTms));

      const parentTileSet = await TileSets.get('aerial@head', GoogleTms);
      if (parentTileSet == null || parentTileSet.type === TileSetType.Vector) throw new Error('null parentTileSet');
      parentTileSet.imagery = imgMap;

      const subTileSet = await TileSets.get('aerial@head:fake', GoogleTms);
      o(subTileSet).equals(null);
    });
  });
});
