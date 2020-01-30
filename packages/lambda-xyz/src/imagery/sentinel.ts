import { MosaicCog } from '../tiff.mosaic';

MosaicCog.create('2019/new-zealand/new_zealand_sentinel_2018-19_10m/2019-12-04/', ['31'], {
    minZoom: 0,
    maxZoom: 32,
    priority: 50,
    year: 2019,
    resolution: 10 * 1000,
});
