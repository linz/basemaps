// exactly as it is returned from the following URL:
// - https://spatialreference.org/ref/epsg/5479/projjson.json
export const mscl2000 = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'ProjectedCRS',
  name: 'RSRGD2000 / MSLC2000',
  base_crs: {
    type: 'GeographicCRS',
    name: 'RSRGD2000',
    datum: {
      type: 'GeodeticReferenceFrame',
      name: 'Ross Sea Region Geodetic Datum 2000',
      ellipsoid: { name: 'GRS 1980', semi_major_axis: 6378137, inverse_flattening: 298.257222101 },
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        { name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' },
        { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' },
      ],
    },
    id: { authority: 'EPSG', code: 4764 },
  },
  conversion: {
    name: 'McMurdo Sound Lambert Conformal 2000',
    method: { name: 'Lambert Conic Conformal (2SP)', id: { authority: 'EPSG', code: 9802 } },
    parameters: [
      { name: 'Latitude of false origin', value: -78, unit: 'degree', id: { authority: 'EPSG', code: 8821 } },
      { name: 'Longitude of false origin', value: 163, unit: 'degree', id: { authority: 'EPSG', code: 8822 } },
      {
        name: 'Latitude of 1st standard parallel',
        value: -76.6666666666667,
        unit: 'degree',
        id: { authority: 'EPSG', code: 8823 },
      },
      {
        name: 'Latitude of 2nd standard parallel',
        value: -79.3333333333333,
        unit: 'degree',
        id: { authority: 'EPSG', code: 8824 },
      },
      { name: 'Easting at false origin', value: 7000000, unit: 'metre', id: { authority: 'EPSG', code: 8826 } },
      { name: 'Northing at false origin', value: 5000000, unit: 'metre', id: { authority: 'EPSG', code: 8827 } },
    ],
  },
  coordinate_system: {
    subtype: 'Cartesian',
    axis: [
      { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' },
      { name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' },
    ],
  },
  scope: 'Topographic mapping, environmental studies.',
  area: 'Antarctica - McMurdo Sound region.',
  bbox: { south_latitude: -81, west_longitude: 153, north_latitude: -76, east_longitude: 173 },
  id: { authority: 'EPSG', code: 5479 },
};
