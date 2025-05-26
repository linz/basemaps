import { LogType } from '@basemaps/shared';
import { createWriteStream } from 'fs';
import { Geometry, LineString, MultiPolygon, Polygon } from 'geojson';
import readline from 'readline';

import { modifyFeature } from '../modify/modify.js';
import { Metrics, Simplify } from '../schema-loader/schema.js';
import { VectorCreationOptions } from '../stac.js';
import { VectorGeoFeature } from '../types/VectorGeoFeature.js';
import { createReadStreamSafe } from '../util.js';
import { Point, simplify } from './simplify.js';

/**
 * Read and modify all ndJson file, then combine into one file,
 *
 * @returns {string} output of joined ndJson filepath
 */
export async function generalize(
  input: URL,
  output: URL,
  options: VectorCreationOptions,
  logger: LogType,
): Promise<Metrics> {
  logger.info({}, 'Generalize:Start');
  const fileStream = await createReadStreamSafe(input.pathname);
  const simplify = options.layer.simplify;

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const writeStream = createWriteStream(output);

  let inputCount = 0;
  let outputCount = 0;
  for await (const line of rl) {
    if (line === '') continue;
    inputCount++;
    // For simplify, duplicate feature for each zoom level with different tolerance
    if (simplify != null) {
      for (const s of simplify) {
        const feature = tag(options, line, s, logger);
        if (feature == null) continue;

        writeStream.write(JSON.stringify(feature) + '\n');
        outputCount++;
      }
    } else {
      const feature = tag(options, line, null, logger);
      if (feature == null) continue;

      writeStream.write(JSON.stringify(feature) + '\n');
      outputCount++;
    }
  }

  await new Promise((resolve) => {
    writeStream.close(resolve);
  });

  const metrics: Metrics = {
    input: inputCount,
    output: outputCount,
  };

  logger.info({ inputCount, outputCount }, 'Generalize:End');
  return metrics;
}

/**
 * Tag feature for layer
 */
function tag(
  options: VectorCreationOptions,
  line: string,
  simplify: Simplify | null,
  logger: LogType,
): VectorGeoFeature | null {
  const feature = {
    ...JSON.parse(line),
    tippecanoe: {
      layer: options.name,
      minzoom: options.layer.style.minZoom,
      maxzoom: options.layer.style.maxZoom,
    },
  } as VectorGeoFeature;

  // copy the stac json's tags to the feature (i.e. 'kind')
  Object.entries(options.layer.tags).forEach(([key, value]) => (feature.properties[key] = value));

  // adjust the feature's metadata and properties
  const modifiedFeature = modifyFeature(feature, options, logger);
  if (modifiedFeature == null) {
    return null;
  }

  // Simplify geometry
  if (simplify != null) {
    // Update the simplified feature zoom level
    modifiedFeature['tippecanoe'] = {
      layer: options.name,
      minzoom: simplify.style.minZoom,
      maxzoom: simplify.style.maxZoom,
    };
    if (simplify.tolerance != null) {
      const geom = modifiedFeature.geometry;
      const type = geom.type;
      const coordinates = simplifyFeature(type, geom, simplify.tolerance);
      if (coordinates == null) {
        return null;
      }
      modifiedFeature.geometry = coordinates;
    }
  }

  // Remove unused properties
  // REVIEW: this function just removes the special tags. something isn't right here
  const cleanedFeature = removeAttributes(modifiedFeature, options);
  return cleanedFeature;
}

function removeAttributes(feature: VectorGeoFeature, options: VectorCreationOptions, remove = true): VectorGeoFeature {
  feature = structuredClone(feature);
  // Add existing attributes into keep attributes and update attribute name if needed
  const properties = feature['properties'];
  const mappings = options.layer.attributes;
  const attributes = new Set(options.metadata.attributes);
  if (mappings != null) {
    Object.keys(mappings).forEach((key) => (properties[mappings[key]] = properties[key]));
  }

  // Remove unused attributes
  Object.keys(properties).forEach((key) => {
    // Add id as feature id and remove from properties
    if (key === 'id') {
      feature['id'] = String(properties[key]);
      delete properties[key];
    }
    if (!attributes.has(key) && remove) delete properties[key];
  });

  feature.properties = properties;

  return feature;
}

/**
 * Simplify geometry by Douglas-Peucker and Radial Distance algorithms.
 * Remove all the points for polygons simplification.
 */
function simplifyFeature(type: string, geometry: Geometry, tolerance: number): Geometry | undefined {
  if (type === 'LineString') {
    const coordinates = (geometry as LineString).coordinates;

    const line = simplify(coordinates as Point[], tolerance);
    return { type, coordinates: line } as Geometry;
  } else if (type === 'Polygon' || type === 'MultiLineString') {
    const coordinates = (geometry as Polygon).coordinates;
    const cor = (coordinates as Point[][]).slice();
    for (let k = 0; k < cor.length; k++) {
      const point = simplify(cor[k], tolerance);
      cor[k] = point;
    }
    return { type, coordinates: cor } as Geometry;
  } else if (type === 'MultiPolygon') {
    let remove = true;
    const coordinates = (geometry as MultiPolygon).coordinates;
    const cor = (coordinates as Point[][][]).slice();
    for (let k = 0; k < cor.length; k++) {
      for (let l = 0; l < cor[k].length; l++) {
        const point = simplify(cor[k][l], tolerance);
        cor[k][l] = point;
        if (point.length > 2) {
          cor[k][l] = point;
          remove = false;
        } else {
          // remove points
          cor[k][l] = [];
        }
      }
    }
    return remove ? undefined : ({ type, coordinates: cor } as Geometry);
  }
  return geometry;
}
