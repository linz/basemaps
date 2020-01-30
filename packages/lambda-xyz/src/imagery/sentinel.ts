import { MosaicCog } from '../tiff.mosaic';
import { EPSG } from '@basemaps/shared';

MosaicCog.create({
    id: '2019-12-04',
    name: 'new_zealand_sentinel_2018-19_10m',
    quadKeys: ['31'],
    projection: EPSG.Wgs84,

    minZoom: 0,
    maxZoom: 32,
    priority: 50,
    year: 2019,
    resolution: 10 * 1000,
});
