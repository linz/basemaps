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
 * @param logger
 * @returns the processed feature
 */
export function handleLayerPlaceLabels(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.info({}, 'HandlePlaceLabels:Start');
  feature = structuredClone(feature);

  // parse the feature's `label` and `zoom_level` properties
  // the feature should define these two properties at minimum
  const label = feature.properties['label'];
  if (typeof label !== 'string') throw new Error('Label property is not a string');

  const zoomLevel = feature.properties['zoom_level'];
  if (typeof zoomLevel !== 'number') throw new Error('Zoom level is not a number');

  // check if we already store a feature with the same 'label' value
  const storedFeature = PlaceLabelsFeatures.get(label);

  if (storedFeature == null) {
    let properties: zTypePlaceLabelsProperties;
    let tippecanoe: zTypePlaceLabelsTippecanoe;

    try {
      properties = zPlaceLabelsProperties.parse({
        name: label,
        kind: feature.properties['style'],
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
        logger.warn({ label }, 'Failed to parse expected properties. Discarding feature.');
        return null;
      } else {
        throw new Error('Unexpected error');
      }
    }

    const newFeature = {
      type: feature.type,
      properties: {
        ...properties,
        // convert the feature's 'kind' property after zod validates 'kind' and 'minzoom'
        kind: convertKind(properties.kind, tippecanoe.minzoom),
      },
      geometry: feature.geometry,
      tippecanoe,
    };

    PlaceLabelsFeatures.set(label, newFeature);

    logger.info({}, 'HandlePlaceLabels:End');
    return newFeature;
  }

  // update the 'minzoom' value of the stored feature
  if (zoomLevel < storedFeature.tippecanoe.minzoom) {
    storedFeature.tippecanoe.minzoom = zoomLevel;
    PlaceLabelsFeatures.set(label, storedFeature);
  }

  // update the 'maxzoom' value of the stored feature
  if (zoomLevel > storedFeature.tippecanoe.maxzoom) {
    storedFeature.tippecanoe.maxzoom = zoomLevel;
    PlaceLabelsFeatures.set(label, storedFeature);
  }

  logger.info({}, 'HandlePlaceLabels:End');
  return storedFeature;
}

/**
 * Logic to tag gazetteer data based on a feature's 'styles' property value.
 * @param kind - 'style' property from gazetteer data
 */
function convertKind(kind: string, minzoom: number): string {
  if (kind.startsWith('ANT')) return 'ant';
  if (kind.startsWith('GEO')) return 'geo';
  if (kind.startsWith('TWN')) {
    if (minzoom <= 8) return 'city';
    if (kind === 'TWN1') return 'suburb';
    if (kind === 'TWN2') return 'town';
    if (kind === 'TWN3') return 'city';
  }
  return '';
}
