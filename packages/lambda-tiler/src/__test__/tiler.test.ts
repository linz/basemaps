import { Epsg } from '@basemaps/geo';
import { Tilers } from '../tiler';
import o from 'ospec';

o.spec('tiler', () => {
    o.spec('convertZ', () => {
        o('nztm2000', () => {
            const tiler = Tilers.get(Epsg.Nztm2000);
            o(tiler?.convertZ(10)).equals(10);
        });
        o('agol', () => {
            const tiler = Tilers.get(Epsg.Nztm2000, 'agol');
            o(tiler?.convertZ(10)).equals(7);
        });
    });
});
