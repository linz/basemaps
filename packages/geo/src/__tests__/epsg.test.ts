import { Epsg } from '../epsg';
import * as o from 'ospec';
import { Nztm2000Tms } from '../tms/nztm2000';

o.spec('Epsg', () => {
    o('should parse Epsg codes', () => {
        o(Epsg.parse('Gogle')).equals(null);
        o(Epsg.parse('google')).equals(Epsg.Google);
        o(Epsg.parse('3857')).equals(Epsg.Google);
        o(Epsg.parse('urn:ogc:def:crs:Epsg::3857')).equals(Epsg.Google);
        o(Epsg.parse('Epsg:3857')).equals(Epsg.Google);
        o(Epsg.parse('global--mercator')).equals(Epsg.Google);
        o(Epsg.parse('global_mercator')).equals(Epsg.Google);

        o(Epsg.parse('wgs84')).equals(Epsg.Wgs84);
        o(Epsg.parse('Epsg:4326')).equals(Epsg.Wgs84);
        o(Epsg.parse('4326')).equals(Epsg.Wgs84);

        o(Epsg.parse('NZTM_2000')).equals(Epsg.Nztm2000);
        o(Epsg.parse('nztm')).equals(Epsg.Nztm2000);
        o(Epsg.parse('Epsg:2193')).equals(Epsg.Nztm2000);
        o(Epsg.parse('2193')).equals(Epsg.Nztm2000);

        o(Epsg.parse('citm_2000')).equals(Epsg.Citm2000);
        o(Epsg.parse('citm')).equals(Epsg.Citm2000);
        o(Epsg.parse('Epsg:3793')).equals(Epsg.Citm2000);
        o(Epsg.parse('3793')).equals(Epsg.Citm2000);
    });

    o('should parse urls', () => {
        o(Epsg.parse('https://www.opengis.net/def/crs/EPSG/0/2193')).equals(Epsg.Nztm2000);
        o(Epsg.parse('https://www.opengis.net/def/crs/EPSG/0/3857')).equals(Epsg.Google);
        o(Epsg.parse(Nztm2000Tms.def.supportedCRS)).equals(Epsg.Nztm2000);
    });
});
