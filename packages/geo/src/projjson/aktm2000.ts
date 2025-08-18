import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

// source: https://spatialreference.org/ref/epsg/3788/projjson.json
// - removed the extra key-value pairs so that it strictly matches the type
export const aktm2000: PROJJSONDefinition = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'ProjectedCRS',
  name: 'NZGD2000 / Auckland Islands TM 2000',
  conversion: {
    name: 'Auckland Islands Transverse Mercator 2000',
    method: { name: 'Transverse Mercator' },
    parameters: [
      { name: 'Latitude of natural origin', value: 0, unit: 'degree' },
      { name: 'Longitude of natural origin', value: 166, unit: 'degree' },
      { name: 'Scale factor at natural origin', value: 1, unit: 'unity' },
      { name: 'False easting', value: 3500000, unit: 'metre' },
      { name: 'False northing', value: 10000000, unit: 'metre' },
    ],
  },
  coordinate_system: {
    subtype: 'Cartesian',
    axis: [
      { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' },
      { name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' },
    ],
  },
  scope: 'Cadastre, engineering survey, topographic mapping.',
  area: 'New Zealand - Snares Island, Auckland Island - onshore.',
  bbox: { south_latitude: -51.13, west_longitude: 165.55, north_latitude: -47.8, east_longitude: 166.93 },
  id: { authority: 'EPSG', code: 3788 },
};
