/**
 * source: https://spatialreference.org/ref/epsg/3788/projjson.json
 */
export const Aktm2000Json = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'ProjectedCRS',
  name: 'NZGD2000 / Auckland Islands TM 2000',
  base_crs: {
    type: 'GeographicCRS',
    name: 'NZGD2000',
    datum: {
      type: 'GeodeticReferenceFrame',
      name: 'New Zealand Geodetic Datum 2000',
      ellipsoid: { name: 'GRS 1980', semi_major_axis: 6378137, inverse_flattening: 298.257222101 },
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        { name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' },
        { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' },
      ],
    },
    id: { authority: 'EPSG', code: 4167 },
  },
  conversion: {
    name: 'Auckland Islands Transverse Mercator 2000',
    method: { name: 'Transverse Mercator', id: { authority: 'EPSG', code: 9807 } },
    parameters: [
      { name: 'Latitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8801 } },
      { name: 'Longitude of natural origin', value: 166, unit: 'degree', id: { authority: 'EPSG', code: 8802 } },
      { name: 'Scale factor at natural origin', value: 1, unit: 'unity', id: { authority: 'EPSG', code: 8805 } },
      { name: 'False easting', value: 3500000, unit: 'metre', id: { authority: 'EPSG', code: 8806 } },
      { name: 'False northing', value: 10000000, unit: 'metre', id: { authority: 'EPSG', code: 8807 } },
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
