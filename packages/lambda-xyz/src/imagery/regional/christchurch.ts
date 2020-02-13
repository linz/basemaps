import { MosaicCog } from '../../tiff.mosaic';
import { EPSG } from '@basemaps/geo';

MosaicCog.create({
    id: '01DZ550FDD4B6726WSPKRQFCWN',
    name: 'christchurch_urban_2018_0.075m',
    projection: EPSG.Wgs84,

    minZoom: 14,
    priority: 150,
    year: 2018,
    resolution: 75,

    quadKeys: ['3131103013220', '31311030123311', '31311030123313'],
});
