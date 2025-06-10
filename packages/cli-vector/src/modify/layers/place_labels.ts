import { LogType } from '@basemaps/shared';
import { z } from 'zod';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import {
  zPlaceLabelsProperties,
  zPlaceLabelsTippecanoe,
  zTypePlaceLabelsProperties,
  zTypePlaceLabelsTippecanoe,
} from '../parser.js';
import { VectorGeoPlaceLabelsFeature } from '../schema.js';

export const PlaceLabelsFeatures = new Map<string, VectorGeoPlaceLabelsFeature>();

/**
 *  Processes a 'place_labels' layer feature. Specifically, features of the gazatteer dataset.
 *
 *  The gazatteer dataset contains multiple features that technically describe the same feature, such that:
 * - 1. One feature will contain all of the expected properties.
 * - 2. The other features will have 'null' values for all expected properties, except `label` and `zoom_level`.
 * - 3. All of the features describing the same feature will have the same `label` value, but different `zoom_level` values.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerPlaceLabels(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.trace({}, 'HandlePlaceLabels:Start');
  feature = structuredClone(feature);

  // read the 'label' and 'zoom_level' properties (required)
  const label = feature.properties['label'];
  if (typeof label !== 'string') throw new Error('Label property is not a string');

  const zoomLevel = feature.properties['zoom_level'];
  if (typeof zoomLevel !== 'number') throw new Error('Zoom level is not a number');

  //DATA PROBLEM: We need to store the first feature which have all the propertie values, the duplicate features will only have null values in the properties
  const storedFeature = PlaceLabelsFeatures.get(label);
  if (storedFeature == null) {
    const newFeature = createNewFeature(feature, label, zoomLevel, logger);
    if (newFeature == null) return null;

    PlaceLabelsFeatures.set(label, newFeature);

    logger.trace({}, 'HandlePlaceLabels:End');
    return newFeature;
  }

  // update the stored feature's 'minzoom' value
  storedFeature.tippecanoe.minzoom = zoomLevel;
  // update the stored feature's 'maxzoom' value
  storedFeature.tippecanoe.maxzoom = zoomLevel;

  logger.trace({}, 'HandlePlaceLabels:End');
  return storedFeature;
}

/**
 * Parses a 'place_labels' layer feature into a VectorGeoPlaceLabelsFeature object.
 *
 * @param feature - the feature to process
 * @param label - the feature's 'label' property
 * @param zoomLevel - the feature's 'zoom_level' property
 * @param logger - a logger instance
 * @returns a VectorGeoPlaceLabelsFeature object
 */
function createNewFeature(
  feature: VectorGeoFeature,
  label: string,
  zoomLevel: number,
  logger: LogType,
): VectorGeoPlaceLabelsFeature | null {
  let properties: zTypePlaceLabelsProperties;
  let tippecanoe: zTypePlaceLabelsTippecanoe;

  try {
    properties = zPlaceLabelsProperties.parse({
      label,
      style: feature.properties['style'],
      place: feature.properties['place'],
      adminlevel: feature.properties['adminlevel'],
      natural: feature.properties['natural'],
      water: feature.properties['water'],
    });

    tippecanoe = zPlaceLabelsTippecanoe.parse({
      layer: 'place_labels',
      minzoom: zoomLevel,
      maxzoom: zoomLevel,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.trace({ label }, 'Failed to parse expected properties. Discarding feature.');
      return null;
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }

  const newFeature = {
    type: feature.type,
    properties: {
      name: properties.label,
      kind: convertStyleToKind(properties.style, tippecanoe.minzoom),
      place: properties.place,
      adminlevel: properties.adminlevel,
      natural: properties.natural,
      water: properties.water,
    },
    geometry: feature.geometry,
    tippecanoe,
  };

  return newFeature;
}

/**
 * Determines a feature's 'kind' based on its 'styles' property.
 *
 * @param style - the feature's 'style' property
 */
function convertStyleToKind(style: string, minzoom: number): string {
  if (style.startsWith('ANT')) return 'ant';
  if (style.startsWith('GEO')) return 'geo';
  if (style.startsWith('TWN')) {
    if (minzoom <= 8) return 'city';
    if (style === 'TWN1') return 'suburb';
    if (style === 'TWN2') return 'town';
    if (style === 'TWN3') return 'city';
  }
  return '';
}
