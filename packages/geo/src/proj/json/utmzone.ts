import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

export class UtmZone {
  private static BaseCode = 32700;
  private static FirstZone = 1;
  private static LastZone = 60;

  private static LongitudeIncrement = 6; // degrees
  private static FirstValues = {
    parameters: {
      longitudeOfNaturalOrigin: {
        value: -177,
      },
    },
    area: {
      from: 180,
      to: 174,
    },
    bbox: {
      westLongitude: -180,
      eastLongitude: -174,
    },
  } as const;

  static isUTMZoneCode(code: number) {
    const zone = code - this.BaseCode;
    const isValidZone = zone >= this.FirstZone && zone <= this.LastZone;

    return Number.isInteger(zone) && isValidZone;
  }

  static generate(code: number): PROJJSONDefinition {
    if (!this.isUTMZoneCode(code)) {
      throw new Error(`The provided code does not describe a UTM Zone: ${code}`);
    }

    const zone = code - this.BaseCode;
    const lonDelta = this.LongitudeIncrement * (zone - 1);

    const NaturalOriginLon = this.FirstValues.parameters.longitudeOfNaturalOrigin.value + lonDelta;
    const westLon = this.FirstValues.bbox.westLongitude + lonDelta;
    const eastLon = this.FirstValues.bbox.eastLongitude + lonDelta;
    const westOrEast = westLon < 0 ? '°W' : '°E';

    const projJson = {
      $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
      type: 'ProjectedCRS',
      name: `WGS 84 / UTM zone ${zone}S`,
      base_crs: {
        type: 'GeographicCRS',
        name: 'WGS 84',
        datum_ensemble: {
          name: 'World Geodetic System 1984 ensemble',
          members: [
            {
              name: 'World Geodetic System 1984 (Transit)',
              id: {
                authority: 'EPSG',
                code: 1166,
              },
            },
            {
              name: 'World Geodetic System 1984 (G730)',
              id: {
                authority: 'EPSG',
                code: 1152,
              },
            },
            {
              name: 'World Geodetic System 1984 (G873)',
              id: {
                authority: 'EPSG',
                code: 1153,
              },
            },
            {
              name: 'World Geodetic System 1984 (G1150)',
              id: {
                authority: 'EPSG',
                code: 1154,
              },
            },
            {
              name: 'World Geodetic System 1984 (G1674)',
              id: {
                authority: 'EPSG',
                code: 1155,
              },
            },
            {
              name: 'World Geodetic System 1984 (G1762)',
              id: {
                authority: 'EPSG',
                code: 1156,
              },
            },
            {
              name: 'World Geodetic System 1984 (G2139)',
              id: {
                authority: 'EPSG',
                code: 1309,
              },
            },
            {
              name: 'World Geodetic System 1984 (G2296)',
              id: {
                authority: 'EPSG',
                code: 1383,
              },
            },
          ],
          ellipsoid: {
            name: 'WGS 84',
            semi_major_axis: 6378137,
            inverse_flattening: 298.257223563,
          },
          accuracy: '2.0',
          id: {
            authority: 'EPSG',
            code: 6326,
          },
        },
        coordinate_system: {
          subtype: 'ellipsoidal',
          axis: [
            {
              name: 'Geodetic latitude',
              abbreviation: 'Lat',
              direction: 'north',
              unit: 'degree',
            },
            {
              name: 'Geodetic longitude',
              abbreviation: 'Lon',
              direction: 'east',
              unit: 'degree',
            },
          ],
        },
        id: {
          authority: 'EPSG',
          code: 4326,
        },
      },
      conversion: {
        name: `UTM zone ${zone}S`,
        method: {
          name: 'Transverse Mercator',
          id: {
            authority: 'EPSG',
            code: 9807,
          },
        },
        parameters: [
          {
            name: 'Latitude of natural origin',
            value: 0,
            unit: 'degree',
            id: {
              authority: 'EPSG',
              code: 8801,
            },
          },
          {
            name: 'Longitude of natural origin',
            value: NaturalOriginLon,
            unit: 'degree',
            id: {
              authority: 'EPSG',
              code: 8802,
            },
          },
          {
            name: 'Scale factor at natural origin',
            value: 0.9996,
            unit: 'unity',
            id: {
              authority: 'EPSG',
              code: 8805,
            },
          },
          {
            name: 'False easting',
            value: 500000,
            unit: 'metre',
            id: {
              authority: 'EPSG',
              code: 8806,
            },
          },
          {
            name: 'False northing',
            value: 10000000,
            unit: 'metre',
            id: {
              authority: 'EPSG',
              code: 8807,
            },
          },
        ],
      },
      coordinate_system: {
        subtype: 'Cartesian',
        axis: [
          {
            name: 'Easting',
            abbreviation: 'E',
            direction: 'east',
            unit: 'metre',
          },
          {
            name: 'Northing',
            abbreviation: 'N',
            direction: 'north',
            unit: 'metre',
          },
        ],
      },
      scope: 'Navigation and medium accuracy spatial referencing.',
      area: `Between ${Math.abs(westLon)}${westOrEast} and ${Math.abs(eastLon)}${westOrEast}, southern hemisphere between 80°S and equator, onshore and offshore.`,
      bbox: {
        south_latitude: -80,
        west_longitude: westLon,
        north_latitude: 0,
        east_longitude: eastLon,
      },
      id: {
        authority: 'EPSG',
        code,
      },
    };

    return projJson;
  }
}
