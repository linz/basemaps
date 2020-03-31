import { EPSG } from '@basemaps/geo';
import { MosaicCog } from '../mosaic.cog';

MosaicCog.create({
    id: '01E3N3D3MA8RTBXPYMW6V2JFFJ',
    name: 'wellington_urban_2017_0-10m',
    projection: EPSG.Google,
    minZoom: 14,
    priority: 150,
    year: 2017,
    resolution: 100,
    quadKeys: [
        '313111000300',
        '313111000302',
        '3131110000333',
        '3131110001203',
        '3131110001212',
        '3131110001221',
        '3131110001222',
        '3131110001223',
        '3131110001230',
        '3131110001232',
        '3131110001233',
        '3131110002111',
        '3131110002113',
        '3131110002131',
        '3131110002133',
        '3131110003010',
        '3131110003012',
        '3131110003030',
        '3131110003032',
    ],
});
