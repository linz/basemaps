import { Epsg } from '@basemaps/geo';
import { Tilers } from '../tiler';
import o from 'ospec';

o.spec('tiler', () => {
    o.spec('getParentZoom', () => {
        o('nztm2000', () => {
            const tiler = Tilers.get(Epsg.Nztm2000);
            o(tiler?.tms?.getParentZoom(10)).equals(10);
        });
    });
});
