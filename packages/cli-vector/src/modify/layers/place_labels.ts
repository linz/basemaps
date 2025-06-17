import { LogType } from '@basemaps/shared';
import { z } from 'zod';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { zPlaceLabelsProperties } from '../parser.js';
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

  const newFeature = createNewFeature(feature, logger);
  if (newFeature == null) return null;

  const name = newFeature.properties.name;

  // DATA PROBLEM: Multiple features will have the same `label` value. However, only the first feature will
  // contain all of the expected properties. All other features with the same `label` value will have null
  // values for the expected properties. So, as we encounter each of the 'other' features, we need to copy
  // the expected properties from the first feature to it, before returning it.
  const storedFeature = PlaceLabelsFeatures.get(name);
  if (storedFeature == null) {
    PlaceLabelsFeatures.set(name, newFeature);

    logger.trace({}, 'HandlePlaceLabels:End');
    return newFeature;
  }

  // update the stored feature's 'minzoom' value
  storedFeature.tippecanoe.minzoom = newFeature.tippecanoe.minzoom;
  // update the stored feature's 'maxzoom' value
  storedFeature.tippecanoe.maxzoom = newFeature.tippecanoe.minzoom;

  logger.trace({}, 'HandlePlaceLabels:End');
  return structuredClone(storedFeature);
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
function createNewFeature(feature: VectorGeoFeature, logger: LogType): VectorGeoPlaceLabelsFeature | null {
  try {
    const properties = zPlaceLabelsProperties.parse({
      label: feature.properties['label'],
      zoom_level: feature.properties['zoom_level'],
      style: feature.properties['style'],
      natural: feature.properties['natural'],
      place: feature.properties['place'],
      water: feature.properties['water'],
    });

    const tippecanoe = {
      layer: 'place_labels',
      minzoom: properties.zoom_level,
      maxzoom: properties.zoom_level,
    };

    const newFeature = {
      type: feature.type,
      properties: {
        name: properties.label,
        kind: convertStyleToKind(properties.style, tippecanoe.minzoom),
        natural: properties.natural,
        place: properties.place,
        water: properties.water,
      },
      geometry: feature.geometry,
      tippecanoe,
    };

    return newFeature;
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.trace({ properties: feature.properties }, 'Failed to parse expected properties. Discarding feature.');
      return null;
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }
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
