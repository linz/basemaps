import { createWriteStream } from 'fs';
import { Feature, Geometry, LineString, MultiPolygon, Polygon } from 'geojson';
import readline from 'readline';

import { Simplify } from '../schema-loader/schema.js';
import { VectorCreationOptions } from '../stac.js';
import { createReadStreamSafe } from '../util.js';
import { Point, simplify } from './simplify.js';

interface VectorGeoFeature extends Feature {
  properties: Record<string, string | boolean | undefined>;
  tippecanoe: {
    layer: string;
    minzoom: number;
    maxzoom: number;
  };
  id?: string;
}

/**
 * Read and modify all ndJson file, then combine into one file,
 *
 * @returns {string} output of joined ndJson filepath
 */
export async function generalize(input: URL, output: URL, options: VectorCreationOptions): Promise<URL | undefined> {
  const features: VectorGeoFeature[] = [];
  const fileStream = await createReadStreamSafe(input.pathname);
  const simplify = options.layer.simplify;

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let inputCount = 0;
  let outputCount = 0;
  for await (const line of rl) {
    if (line === '') continue;
    inputCount++;
    // For simplify Duplicate feature for each zoom level with different tolerance
    if (simplify != null) {
      for (const s of simplify) {
        const feature = tag(options, line, s);
        if (feature == null) continue;
        outputCount++;
        features.push(JSON.parse(feature) as VectorGeoFeature);
      }
    } else {
      const feature = tag(options, line);
      if (feature == null) continue;
      outputCount++;
      features.push(JSON.parse(feature) as VectorGeoFeature);
    }
  }
  options.layer.metrics = { input: inputCount, output: outputCount };

  if (features.length > 0) {
    const writeStream = createWriteStream(output);
    for (const feature of features) {
      writeStream.write(JSON.stringify(feature) + '\n');
    }
    writeStream.close();
    return output;
  }
  return undefined;
}

/**
 * Tag feature for layer
 */
function tag(options: VectorCreationOptions, line: string, simplify?: Simplify): string | undefined {
  const feature = JSON.parse(line) as VectorGeoFeature;

  feature['tippecanoe'] = {
    layer: options.name,
    minzoom: options.layer.style.minZoom,
    maxzoom: options.layer.style.maxZoom,
  };

  Object.entries(options.layer.tags).forEach(([key, value]) => (feature.properties[key] = value));

  // TODO: Add support of special tagging logics.

  // Simplify geometry
  if (simplify != null) {
    // Update the simplified feature zoom level
    feature['tippecanoe'] = {
      layer: options.name,
      minzoom: simplify.style.minZoom,
      maxzoom: simplify.style.maxZoom,
    };
    if (simplify.tolerance != null) {
      const geom = feature.geometry;
      const type = geom.type;
      const coordinates = simplifyFeature(type, geom, simplify.tolerance);
      if (coordinates == null) return undefined;
      feature.geometry = coordinates;
    }
  }

  // Remove unused properties
  removeAttributes(feature, options);

  return JSON.stringify(feature);
}

function removeAttributes(feature: VectorGeoFeature, options: VectorCreationOptions, remove = true): void {
  // Add existing attributes into keep attributes and update attribute name if needed
  const properties = feature['properties'];
  const mappings = options.layer.attributes;
  const attributes = new Set(options.metadata.attributes);
  if (mappings != null)
    Object.keys(mappings).forEach((key) => {
      properties[mappings[key]] = properties[key];
    });

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
