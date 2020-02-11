import { EPSG } from '@basemaps/shared';
import { MosaicCog } from '../../tiff.mosaic';

MosaicCog.create({
    id: '01E0955R8T5NPQTMC2J2TFQNB5',
    name: 'whanganui_urban_2017-18_0-075m',
    projection: EPSG.Wgs84,

    minZoom: 14,
    priority: 150,
    year: 2017,
    resolution: 75,

    quadKeys: [
        '311333202332',
        '311333202333',
        '311333203222',
        '311333220110',
        '311333220111',
        '311333221000',
        '3113332023231',
        '3113332023233',
        '3113332201121',
        '3113332201130',
        '3113332201131',
        '3113332210020',
        '3113332210021',
    ],
});
