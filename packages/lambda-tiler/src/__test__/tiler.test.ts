import { Epsg } from '@basemaps/geo';
import { Tilers } from '../tiler';
import o from 'ospec';

o.spec('tiler', () => {
    o.spec('getParentZoom', () => {
        o('nztm2000', () => {
            const tiler = Tilers.get(Epsg.Nztm2000);
            o(tiler?.tms?.getParentZoom(10)).equals(10);
        });
        o('agol', () => {
            const tiler = Tilers.get(Epsg.Nztm2000, 'agol');
            o(tiler?.tms?.getParentZoom(0)).equals(0);
            o(tiler?.tms?.getParentZoom(5)).equals(0);
            o(tiler?.tms?.getParentZoom(10)).equals(5);
            o(tiler?.tms?.getParentZoom(15)).equals(10);
            o(tiler?.tms?.getParentZoom(20)).equals(14);
            o(tiler?.tms?.getParentZoom(23)).equals(16);
        });
    });
});
