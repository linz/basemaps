import { Projection } from '../projection';
import * as o from 'ospec';
import { Nztm2000Tms } from '../tms/nztm2000';
import { EPSG } from '../epsg';
import { approxLatLon } from './test.util';

const { Wgs84Bound } = Projection;

o.spec('Projection', () => {
    const proj256 = new Projection(256);
    const proj512 = new Projection(512);

    o('should create tile sized bounds', () => {
        const bounds256 = proj256.getPixelsFromTile(1, 2);
        o(bounds256.toJson()).deepEquals({ x: 256, y: 512, width: 256, height: 256 });

        const bounds512 = proj512.getPixelsFromTile(1, 2);
        o(bounds512.toJson()).deepEquals({ x: 512, y: 1024, width: 512, height: 512 });
    });

    o('should get center of tile', () => {
        const latLon0 = proj256.getLatLonCenterFromTile(0, 0, 0);
        o(latLon0).deepEquals({ lat: 0, lon: 0 });

        const latLonA = proj256.getLatLonCenterFromTile(0, 0, 1);
        const latLonB = proj256.getLatLonCenterFromTile(0, 1, 1);
        const latLonC = proj256.getLatLonCenterFromTile(1, 1, 1);
        const latLonD = proj256.getLatLonCenterFromTile(1, 0, 1);

        approxLatLon(latLonA, { lat: Wgs84Bound.lat / 2, lon: -Wgs84Bound.lon / 2 });
        approxLatLon(latLonB, { lat: -Wgs84Bound.lat / 2, lon: -Wgs84Bound.lon / 2 });
        approxLatLon(latLonC, { lat: -Wgs84Bound.lat / 2, lon: Wgs84Bound.lon / 2 });
        approxLatLon(latLonD, { lat: Wgs84Bound.lat / 2, lon: Wgs84Bound.lon / 2 });
    });

    o('should parseEpsgString', () => {
        o(Projection.parseEpsgString('Gogle')).equals(null);
        o(Projection.parseEpsgString('google')).equals(EPSG.Google);
        o(Projection.parseEpsgString('3857')).equals(EPSG.Google);
        o(Projection.parseEpsgString('urn:ogc:def:crs:EPSG::3857')).equals(EPSG.Google);
        o(Projection.parseEpsgString('EpSg:3857')).equals(EPSG.Google);
        o(Projection.parseEpsgString('global--mercator')).equals(EPSG.Google);
        o(Projection.parseEpsgString('global_mercator')).equals(EPSG.Google);

        o(Projection.parseEpsgString('wgs84')).equals(EPSG.Wgs84);
        o(Projection.parseEpsgString('epsg:4326')).equals(EPSG.Wgs84);
        o(Projection.parseEpsgString('4326')).equals(EPSG.Wgs84);

        o(Projection.parseEpsgString('NZTM_2000')).equals(EPSG.Nztm2000);
        o(Projection.parseEpsgString('nztm')).equals(EPSG.Nztm2000);
        o(Projection.parseEpsgString('epsg:2193')).equals(EPSG.Nztm2000);
        o(Projection.parseEpsgString('2193')).equals(EPSG.Nztm2000);

        o(Projection.parseEpsgString('citm_2000')).equals(EPSG.Citm2000);
        o(Projection.parseEpsgString('citm')).equals(EPSG.Citm2000);
        o(Projection.parseEpsgString('epsg:3793')).equals(EPSG.Citm2000);
        o(Projection.parseEpsgString('3793')).equals(EPSG.Citm2000);
    });

    o('should parse urls', () => {
        o(Projection.parseEpsgString('https://www.opengis.net/def/crs/EPSG/0/2193')).equals(EPSG.Nztm2000);
        o(Projection.parseEpsgString('https://www.opengis.net/def/crs/EPSG/0/3857')).equals(EPSG.Google);
        o(Projection.parseEpsgString(Nztm2000Tms.def.supportedCRS)).equals(EPSG.Nztm2000);
    });

    o('constants', () => {
        o(Wgs84Bound).deepEquals({ lat: 85.0511287798066, lon: 180 });
        o(Projection.GoogleScaleDenominator).equals(559082264.029);
    });
});
