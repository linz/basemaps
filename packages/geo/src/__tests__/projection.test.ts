import * as o from 'ospec';
import { Projection } from '../projection';
import { Approx } from '@basemaps/test';

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

        Approx.latLon(latLonA, { lat: Wgs84Bound.lat / 2, lon: -Wgs84Bound.lon / 2 });
        Approx.latLon(latLonB, { lat: -Wgs84Bound.lat / 2, lon: -Wgs84Bound.lon / 2 });
        Approx.latLon(latLonC, { lat: -Wgs84Bound.lat / 2, lon: Wgs84Bound.lon / 2 });
        Approx.latLon(latLonD, { lat: Wgs84Bound.lat / 2, lon: Wgs84Bound.lon / 2 });
    });

    o('constants', () => {
        o(Wgs84Bound).deepEquals({ lat: 85.0511287798066, lon: 180 });
        o(Projection.GoogleScaleDenominator).equals(559082264.029);
    });
});
