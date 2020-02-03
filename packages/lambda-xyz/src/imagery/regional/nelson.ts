import { EPSG } from '@basemaps/shared';
import { MosaicCog } from '../../tiff.mosaic';

MosaicCog.create({
    id: '01E04CPBYCMFP7WC24DY7APVGF',
    name: 'nelson_rural_2018-19_0-3m',
    projection: EPSG.Wgs84,

    minZoom: 13,
    priority: 100,
    year: 2018,
    resolution: 300,
    quadKeys: [
        '31311011011',
        '31311011012',
        '31311011013',
        '31311011021',
        '31311011030',
        '313110110031',
        '313110110032',
        '313110110033',
        '313110110102',
        '313110110103',
        '313110110230',
        '313110110231',
        '313110110320',
    ],
});
