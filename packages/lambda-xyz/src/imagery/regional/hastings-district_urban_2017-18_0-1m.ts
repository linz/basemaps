import { EPSG } from '@basemaps/geo';
import { MosaicCog } from '../../tiff.mosaic';

MosaicCog.create({
    id: '01E0957CZV2AXVBQ111295C13N',
    name: 'hastings-district_urban_2017-18_0-1m',
    projection: EPSG.Wgs84,

    minZoom: 14,
    priority: 150,
    year: 2017,
    resolution: 100,

    quadKeys: [
        '31133321312',
        '31133321330',
        '311333211321',
        '311333211322',
        '311333211323',
        '311333213011',
        '311333213013',
        '311333213031',
        '311333213032',
        '311333213033',
        '311333213100',
        '311333213102',
        '311333213201',
        '311333213210',
        '311333213211',
        '311333213213',
        '311333213312',
        '311333213321',
    ],
});
