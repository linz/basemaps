import { MosaicCog } from './mosaic.cog';
import { EPSG } from '@basemaps/geo';

MosaicCog.create({
    id: '01E4PN40AEH10EH128AG28YSDM',
    name: 'new_zealand_sentinel_2018-19_10m',
    quadKeys: ['31'],
    projection: EPSG.Google,

    minZoom: 0,
    maxZoom: 32,
    priority: 50,
    year: 2019,
    resolution: 10 * 1000,
});
