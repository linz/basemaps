import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

interface Id {
  conversion: {
    parameters: Array<{
      id: {
        authority: string;
        code: number;
      };
    }>;
  };
}

export class FakeData {
  static ProjJson: Record<number, PROJJSONDefinition> = {
    /**
     * @link https://spatialreference.org/ref/epsg/32701/projjson.json
     */
    32701: {
      $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
      type: 'ProjectedCRS',
      name: 'WGS 84 / UTM zone 1S',
      base_crs: {
        type: 'GeographicCRS',
        name: 'WGS 84',
        datum_ensemble: {
          name: 'World Geodetic System 1984 ensemble',
          members: [
            { name: 'World Geodetic System 1984 (Transit)', id: { authority: 'EPSG', code: 1166 } },
            { name: 'World Geodetic System 1984 (G730)', id: { authority: 'EPSG', code: 1152 } },
            { name: 'World Geodetic System 1984 (G873)', id: { authority: 'EPSG', code: 1153 } },
            { name: 'World Geodetic System 1984 (G1150)', id: { authority: 'EPSG', code: 1154 } },
            { name: 'World Geodetic System 1984 (G1674)', id: { authority: 'EPSG', code: 1155 } },
            { name: 'World Geodetic System 1984 (G1762)', id: { authority: 'EPSG', code: 1156 } },
            { name: 'World Geodetic System 1984 (G2139)', id: { authority: 'EPSG', code: 1309 } },
            { name: 'World Geodetic System 1984 (G2296)', id: { authority: 'EPSG', code: 1383 } },
          ],
          ellipsoid: { name: 'WGS 84', semi_major_axis: 6378137, inverse_flattening: 298.257223563 },
          accuracy: '2.0',
          id: { authority: 'EPSG', code: 6326 },
        },
        coordinate_system: {
          subtype: 'ellipsoidal',
          axis: [
            { name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' },
            { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' },
          ],
        },
        id: { authority: 'EPSG', code: 4326 },
      },
      conversion: {
        name: 'UTM zone 1S',
        method: { name: 'Transverse Mercator', id: { authority: 'EPSG', code: 9807 } },
        parameters: [
          { name: 'Latitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8801 } },
          { name: 'Longitude of natural origin', value: -177, unit: 'degree', id: { authority: 'EPSG', code: 8802 } },
          {
            name: 'Scale factor at natural origin',
            value: 0.9996,
            unit: 'unity',
            id: { authority: 'EPSG', code: 8805 },
          },
          { name: 'False easting', value: 500000, unit: 'metre', id: { authority: 'EPSG', code: 8806 } },
          { name: 'False northing', value: 10000000, unit: 'metre', id: { authority: 'EPSG', code: 8807 } },
        ],
      },
      coordinate_system: {
        subtype: 'Cartesian',
        axis: [
          { name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' },
          { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' },
        ],
      },
      scope: 'Navigation and medium accuracy spatial referencing.',
      area: 'Between 180°W and 174°W, southern hemisphere between 80°S and equator, onshore and offshore.',
      bbox: { south_latitude: -80, west_longitude: -180, north_latitude: 0, east_longitude: -174 },
      id: { authority: 'EPSG', code: 32701 },
    },

    /**
     * @link https://spatialreference.org/ref/epsg/32730/projjson.json
     */
    32730: {
      $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
      type: 'ProjectedCRS',
      name: 'WGS 84 / UTM zone 30S',
      base_crs: {
        type: 'GeographicCRS',
        name: 'WGS 84',
        datum_ensemble: {
          name: 'World Geodetic System 1984 ensemble',
          members: [
            { name: 'World Geodetic System 1984 (Transit)', id: { authority: 'EPSG', code: 1166 } },
            { name: 'World Geodetic System 1984 (G730)', id: { authority: 'EPSG', code: 1152 } },
            { name: 'World Geodetic System 1984 (G873)', id: { authority: 'EPSG', code: 1153 } },
            { name: 'World Geodetic System 1984 (G1150)', id: { authority: 'EPSG', code: 1154 } },
            { name: 'World Geodetic System 1984 (G1674)', id: { authority: 'EPSG', code: 1155 } },
            { name: 'World Geodetic System 1984 (G1762)', id: { authority: 'EPSG', code: 1156 } },
            { name: 'World Geodetic System 1984 (G2139)', id: { authority: 'EPSG', code: 1309 } },
            { name: 'World Geodetic System 1984 (G2296)', id: { authority: 'EPSG', code: 1383 } },
          ],
          ellipsoid: { name: 'WGS 84', semi_major_axis: 6378137, inverse_flattening: 298.257223563 },
          accuracy: '2.0',
          id: { authority: 'EPSG', code: 6326 },
        },
        coordinate_system: {
          subtype: 'ellipsoidal',
          axis: [
            { name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' },
            { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' },
          ],
        },
        id: { authority: 'EPSG', code: 4326 },
      },
      conversion: {
        name: 'UTM zone 30S',
        method: { name: 'Transverse Mercator', id: { authority: 'EPSG', code: 9807 } },
        parameters: [
          { name: 'Latitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8801 } },
          { name: 'Longitude of natural origin', value: -3, unit: 'degree', id: { authority: 'EPSG', code: 8802 } },
          {
            name: 'Scale factor at natural origin',
            value: 0.9996,
            unit: 'unity',
            id: { authority: 'EPSG', code: 8805 },
          },
          { name: 'False easting', value: 500000, unit: 'metre', id: { authority: 'EPSG', code: 8806 } },
          { name: 'False northing', value: 10000000, unit: 'metre', id: { authority: 'EPSG', code: 8807 } },
        ],
      },
      coordinate_system: {
        subtype: 'Cartesian',
        axis: [
          { name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' },
          { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' },
        ],
      },
      scope: 'Navigation and medium accuracy spatial referencing.',
      area: 'Between 6°W and 0°W, southern hemisphere between 80°S and equator, onshore and offshore.',
      bbox: { south_latitude: -80, west_longitude: -6, north_latitude: 0, east_longitude: 0 },
      id: { authority: 'EPSG', code: 32730 },
    },

    /**
     * @link https://spatialreference.org/ref/epsg/32760/projjson.json
     */
    32760: {
      $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
      type: 'ProjectedCRS',
      name: 'WGS 84 / UTM zone 60S',
      base_crs: {
        type: 'GeographicCRS',
        name: 'WGS 84',
        datum_ensemble: {
          name: 'World Geodetic System 1984 ensemble',
          members: [
            { name: 'World Geodetic System 1984 (Transit)', id: { authority: 'EPSG', code: 1166 } },
            { name: 'World Geodetic System 1984 (G730)', id: { authority: 'EPSG', code: 1152 } },
            { name: 'World Geodetic System 1984 (G873)', id: { authority: 'EPSG', code: 1153 } },
            { name: 'World Geodetic System 1984 (G1150)', id: { authority: 'EPSG', code: 1154 } },
            { name: 'World Geodetic System 1984 (G1674)', id: { authority: 'EPSG', code: 1155 } },
            { name: 'World Geodetic System 1984 (G1762)', id: { authority: 'EPSG', code: 1156 } },
            { name: 'World Geodetic System 1984 (G2139)', id: { authority: 'EPSG', code: 1309 } },
            { name: 'World Geodetic System 1984 (G2296)', id: { authority: 'EPSG', code: 1383 } },
          ],
          ellipsoid: { name: 'WGS 84', semi_major_axis: 6378137, inverse_flattening: 298.257223563 },
          accuracy: '2.0',
          id: { authority: 'EPSG', code: 6326 },
        },
        coordinate_system: {
          subtype: 'ellipsoidal',
          axis: [
            { name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' },
            { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' },
          ],
        },
        id: { authority: 'EPSG', code: 4326 },
      },
      conversion: {
        name: 'UTM zone 60S',
        method: { name: 'Transverse Mercator', id: { authority: 'EPSG', code: 9807 } },
        parameters: [
          { name: 'Latitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8801 } },
          { name: 'Longitude of natural origin', value: 177, unit: 'degree', id: { authority: 'EPSG', code: 8802 } },
          {
            name: 'Scale factor at natural origin',
            value: 0.9996,
            unit: 'unity',
            id: { authority: 'EPSG', code: 8805 },
          },
          { name: 'False easting', value: 500000, unit: 'metre', id: { authority: 'EPSG', code: 8806 } },
          { name: 'False northing', value: 10000000, unit: 'metre', id: { authority: 'EPSG', code: 8807 } },
        ],
      },
      coordinate_system: {
        subtype: 'Cartesian',
        axis: [
          { name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' },
          { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' },
        ],
      },
      scope: 'Navigation and medium accuracy spatial referencing.',
      area: 'Between 174°E and 180°E, southern hemisphere between 80°S and equator, onshore and offshore. New Zealand.',
      bbox: { south_latitude: -80, west_longitude: 174, north_latitude: 0, east_longitude: 180 },
      id: { authority: 'EPSG', code: 32760 },
    },
  } as Record<number, PROJJSONDefinition & Id>;
}
