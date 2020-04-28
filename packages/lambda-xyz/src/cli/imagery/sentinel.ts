import { EPSG } from '@basemaps/geo';
import { MosaicCog } from './mosaic.cog';

MosaicCog.create({
    id: '01E6YVVMYK4A1AA8SQ4EHNT13M',
    name: 'new_zealand_sentinel_2018-19_10m',

    projection: EPSG.Google,

    minZoom: 0,
    maxZoom: 32,
    priority: 50,
    year: 2019,
    resolution: 10 * 1000,
    quadKeys: ['31133', '31310', '31311'],
});
