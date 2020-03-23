import { EPSG } from '@basemaps/geo';
import { MosaicCog } from '../../tiff.mosaic';

MosaicCog.create({
    id: '01E3N4FQ7CKMS59BHBFY5RS0PN',
    name: 'northland_rural_2014-16_0-4m',
    projection: EPSG.Wgs84,

    minZoom: 13,
    priority: 100,
    year: 2014,
    resolution: 400,

    quadKeys: [
        '311330312',
        '311330331',
        '3113303011',
        '3113303102',
        '3113303130',
        '3113303132',
        '3113303133',
        '3113303301',
        '3113303330',
        '3113303331',
        '3113303333',
        '3113312200',
        '3113312202',
        '3113312220',
        '3113312222',
        '3113330000',
        '31133030101',
        '31133030103',
        '31133030130',
        '31133030131',
        '31133030133',
        '31133031000',
        '31133031002',
        '31133031030',
        '31133031032',
        '31133031033',
        '31133031122',
        '31133031312',
        '31133031313',
        '31133033001',
        '31133033003',
        '31133033030',
        '31133033031',
        '31133033033',
        '31133033321',
        '31133033323',
        '31133120202',
        '31133120220',
        '31133120222',
        '31133122212',
        '31133122230',
        '31133211110',
        '31133211111',
        '31133211113',
        '31133300020',
        '31133300021',
    ],
});
