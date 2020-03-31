import { MosaicCog } from './mosaic.cog';
import { EPSG } from '@basemaps/geo';

MosaicCog.create({
    id: '01DYE4EGR92TNMV16AHXSR45JH',
    name: 'gebco',
    projection: EPSG.Google,
    priority: 10,
    year: 2019,
    resolution: 100 * 1000,
    maxZoom: 15,

    quadKeys: ['0', '1', '2', '3'],
});
