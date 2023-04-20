import { GoogleTms, QuadKey } from '@basemaps/geo';
import o from 'ospec';
import { addChildren, addSurrounding } from '../covering.js';

o.spec('getChildren', () => {
  o('should get children', () => {
    o(addChildren({ z: 0, x: 0, y: 0 })).deepEquals([
      { z: 1, x: 0, y: 0 },
      { z: 1, x: 1, y: 0 },
      { z: 1, x: 0, y: 1 },
      { z: 1, x: 1, y: 1 },
    ]);
  });

  ['', '3', '310', '013', '3100123', '3103123231312301'].map((qk) => {
    o('should match QuadKey: ' + qk, () => {
      const tileChildren = addChildren(QuadKey.toTile(qk));
      const qkChildren = QuadKey.children(qk).map(QuadKey.toTile);
      o(tileChildren).deepEquals(qkChildren);
    });
  });
});

o.spec('SurroundingTiles', () => {
  o('should not have surrounding tiles at z0', () => {
    const todo = addSurrounding({ z: 0, x: 0, y: 0 }, GoogleTms);
    o(todo).deepEquals([]);
  });

  o('should add all surrounding tiles', () => {
    o(addSurrounding({ z: 2, x: 1, y: 1 }, GoogleTms)).deepEquals([
      { z: 2, x: 1, y: 0 },
      { z: 2, x: 2, y: 1 },
      { z: 2, x: 1, y: 2 },
      { z: 2, x: 0, y: 1 },
    ]);
  });

  o('should wrap at matrix extent', () => {
    // Top left tile
    o(addSurrounding({ z: 2, x: 0, y: 0 }, GoogleTms)).deepEquals([
      { z: 2, x: 0, y: 3 }, // North - Wrapping North to South
      { z: 2, x: 1, y: 0 }, // East
      { z: 2, x: 0, y: 1 }, // South
      { z: 2, x: 3, y: 0 }, // West - Wrapping West to East
    ]);

    // Bottom right tile
    o(addSurrounding({ z: 2, x: 3, y: 3 }, GoogleTms)).deepEquals([
      { z: 2, x: 3, y: 2 }, // North
      { z: 2, x: 0, y: 3 }, // East -- Wrapping East to West
      { z: 2, x: 3, y: 0 }, // South -- Wrapping South to NOrth
      { z: 2, x: 2, y: 3 }, // West
    ]);
  });
});
