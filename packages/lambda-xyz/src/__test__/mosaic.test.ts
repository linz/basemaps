import { MosaicSort } from '../tiff';
import { MosaicCog, MosaicCogOptions } from '../tiff.mosaic';
import { EPSG } from '@basemaps/geo';
import * as o from 'ospec';
import 'source-map-support/register';

o.spec('MosaicSort', () => {
    const base: MosaicCogOptions = {
        id: 'a',
        quadKeys: [],
        projection: EPSG.Wgs84,
        name: 'no name',
        priority: 1,
        year: 2019,
        resolution: 1,
    };

    o('should fall back to name', () => {
        const mosaics = [
            new MosaicCog({ ...base, id: 'a' }),
            new MosaicCog({ ...base, id: 'c' }),
            new MosaicCog({ ...base, id: 'b' }),
        ];
        mosaics.sort(MosaicSort);
        o(mosaics.map((c) => c.id)).deepEquals(['a', 'b', 'c']);
    });

    o('should sort by resolution', () => {
        const mosaics = [
            new MosaicCog({ ...base, id: 'a', resolution: 1 }),
            new MosaicCog({ ...base, id: 'b', resolution: 10 }),
            new MosaicCog({ ...base, id: 'c', resolution: 100 }),
        ];
        mosaics.sort(MosaicSort);
        o(mosaics.map((c) => c.id)).deepEquals(['c', 'b', 'a']);
    });

    o('should sort by year', () => {
        const mosaics = [
            new MosaicCog({ ...base, id: 'a', year: 2019, resolution: 1 }),
            new MosaicCog({ ...base, id: 'b', year: 2017, resolution: 10 }),
            new MosaicCog({ ...base, id: 'c', year: 2018, resolution: 1 }),
        ];
        mosaics.sort(MosaicSort);
        o(mosaics.map((c) => c.id)).deepEquals(['b', 'c', 'a']);
    });

    o('should sort by priority', () => {
        const mosaics = [
            new MosaicCog({ ...base, id: 'a', year: 2018, priority: 50 }),
            new MosaicCog({ ...base, id: 'b', year: 2018, priority: 1 }),
            new MosaicCog({ ...base, id: 'c', year: 2019, priority: 100 }),
        ];
        mosaics.sort(MosaicSort);
        o(mosaics.map((c) => c.id)).deepEquals(['b', 'a', 'c']);
    });
});
