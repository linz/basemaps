import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

/**
 * The ProjJSON definition for UTM Zone 1S (EPSG: 32701) pulled via the `spatialreference.org`
 * API. We use this as a template for generating ProjJSON definitions for other zones.
 *
 * @link https://spatialreference.org/ref/epsg/32701/projjson.json
 */
const UtmZoneTemplate = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'ProjectedCRS',
  name: `WGS 84 / UTM zone 1S`,
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
    name: `UTM zone 1S`,
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
        value: -177,
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
  area: `Between 180°W and $174°W, southern hemisphere between 80°S and equator, onshore and offshore.`,
  bbox: {
    south_latitude: -80,
    west_longitude: -180,
    north_latitude: 0,
    east_longitude: -174,
  },
  id: {
    authority: 'EPSG',
    code: 32701,
  },
};

/**
 * Provides utilities for validating EPSG codes and generating ProjJSON definitions
 * for UTM (Universal Transverse Mercator) zones.
 *
 * - The EPSG code base is set to `32700`, corresponding to the southern hemisphere zones.
 * - Valid zone numbers range from 1 to 60.
 * - Each zone spans 6° of longitude.
 */
export class UtmZone {
  /** EPSG code base for UTM zones in the southern hemisphere (32700). */
  private static BaseCode = 32700;

  /** The first valid UTM zone number (1). */
  private static FirstZone = 1;

  /** The last valid UTM zone number (60). */
  private static LastZone = 60;

  /** The longitude width of each UTM zone, in degrees (6°). */
  private static LonIncrement = 6;

  /**
   * Determines whether the provided EPSG code corresponds
   * to a valid UTM zone in the southern hemisphere.
   *
   * @param code - The EPSG code to validate (e.g. 32705 for UTM Zone 5S).
   * @returns `true` if the code describes a valid UTM zone. Otherwise, `false`.
   */
  static isUTMZoneCode(code: number): boolean {
    const zone = code - this.BaseCode;
    const isValidZone = zone >= this.FirstZone && zone <= this.LastZone;

    return Number.isInteger(zone) && isValidZone;
  }

  /**
   * Generates a ProjJSON definition for the given UTM zone code.
   *
   * 1. Validates the EPSG code against UTM zone rules.
   * 2. Calculates the natural origin longitude and bounding box.
   * 3. Clones the ProjJSON template and overwrites various fields
   *    with values specific to the requested UTM zone.
   *
   * @param code - The EPSG code for the UTM zone (e.g. 32705 for UTM Zone 5S).
   * @returns A ProjJSON definition describing the UTM zone.
   *
   * @throws {Error} If the code does not correspond to a valid UTM zone.
   */
  static generateProjJson(code: number): PROJJSONDefinition {
    if (!this.isUTMZoneCode(code)) {
      throw new Error(`The provided code does not describe a UTM Zone: ${code}`);
    }

    // calculate dynamic values
    const zone = code - this.BaseCode;
    const lonDelta = this.LonIncrement * (zone - 1);

    const naturalOriginLon = UtmZoneTemplate.conversion.parameters[1].value + lonDelta;
    const westLon = UtmZoneTemplate.bbox.west_longitude + lonDelta;
    const eastLon = UtmZoneTemplate.bbox.east_longitude + lonDelta;
    const hemisphere = westLon < 0 ? 'W' : 'E';

    // overwrite template values
    const projJson = structuredClone(UtmZoneTemplate);

    // name
    projJson.name = `WGS 84 / UTM zone ${zone}S`;

    // conversion
    projJson.conversion.name = `UTM zone ${zone}S`;
    projJson.conversion.parameters[1].value = naturalOriginLon;

    // area
    projJson.area = `Between ${Math.abs(westLon)}°${hemisphere} and ${Math.abs(eastLon)}°${hemisphere}, southern hemisphere between 80°S and equator, onshore and offshore.`;

    // bbox
    projJson.bbox.west_longitude = westLon;
    projJson.bbox.east_longitude = eastLon;

    // id
    projJson.id.code = code;

    return projJson;
  }
}
