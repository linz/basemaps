import { MosaicSort } from '../tiff';
import { MosaicCog } from '../tiff.mosaic';

describe('MosaicSort', () => {
    it('should fall back to name', () => {
        const mosaics = [
            new MosaicCog('a', [], { year: 2018, resolution: 1, priority: 100 }),
            new MosaicCog('c', [], { year: 2018, resolution: 1, priority: 100 }),
            new MosaicCog('b', [], { year: 2018, resolution: 1, priority: 100 }),
        ];
        mosaics.sort(MosaicSort);
        expect(mosaics.map(c => c.basePath)).toEqual(['a', 'b', 'c']);
    });

    it('should sort by resolution', () => {
        const mosaics = [
            new MosaicCog('a', [], { year: 2018, resolution: 1, priority: 100 }),
            new MosaicCog('b', [], { year: 2018, resolution: 10, priority: 100 }),
            new MosaicCog('c', [], { year: 2018, resolution: 100, priority: 100 }),
        ];
        mosaics.sort(MosaicSort);
        expect(mosaics.map(c => c.basePath)).toEqual(['c', 'b', 'a']);
    });

    it('should sort by year', () => {
        const mosaics = [
            new MosaicCog('a', [], { year: 2019, resolution: 1, priority: 1 }),
            new MosaicCog('b', [], { year: 2017, resolution: 10, priority: 1 }),
            new MosaicCog('c', [], { year: 2018, resolution: 1, priority: 1 }),
        ];
        mosaics.sort(MosaicSort);
        expect(mosaics.map(c => c.basePath)).toEqual(['b', 'c', 'a']);
    });

    it('should sort by priority', () => {
        const mosaics = [
            new MosaicCog('a', [], { year: 2018, resolution: 1, priority: 50 }),
            new MosaicCog('b', [], { year: 2018, resolution: 1, priority: 1 }),
            new MosaicCog('c', [], { year: 2019, resolution: 1, priority: 100 }),
        ];
        mosaics.sort(MosaicSort);
        expect(mosaics.map(c => c.basePath)).toEqual(['b', 'a', 'c']);
    });
});
