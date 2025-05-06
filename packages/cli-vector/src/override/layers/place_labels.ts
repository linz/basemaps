import { LogType } from '@basemaps/shared';
import { z } from 'zod';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import {
  zPlaceLabelsProperties,
  zPlaceLabelsTippecanoe,
  zTypePlaceLabelsProperties,
  zTypePlaceLabelsTippecanoe,
} from '../parser.js';
import { VectorGeoPlaceLabelsFeature } from '../schema.js';

const Features = new Map<string, VectorGeoPlaceLabelsFeature>();

export function handleLayerPlaceLabels(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.info({}, 'HandlePlaceLabels:Start');
  feature = structuredClone(feature);

  let properties: zTypePlaceLabelsProperties;
  let tippecanoe: zTypePlaceLabelsTippecanoe;

  try {
    properties = zPlaceLabelsProperties.parse({
      name: feature.properties['label'],
      kind: feature.properties['style'],
      place: feature.properties['place'],
      adminlevel: feature.properties['adminlevel'],
      natural: feature.properties['natural'],
      water: feature.properties['water'],
    });

    tippecanoe = zPlaceLabelsTippecanoe.parse({
      layer: 'place_labels',
      minzoom: feature.properties['zoom_level'],
      maxzoom: feature.properties['zoom_level'],
    });
  } catch (e) {
    // each feature in the gazatteer dataset contains one record with all
    // expected properties, and duplicate records with 'null' properties.
    // when we encounter such duplicate records, we return null to discard them
    if (e instanceof z.ZodError) {
      return null;
    } else {
      throw new Error('Something went wrong');
    }
  }

  const newFeature = {
    type: feature.type,
    properties: {
      ...properties,
      // we convert the 'kind' property after zod validates 'kind' and 'minzoom'
      kind: convertStyle(properties.kind, tippecanoe.minzoom),
    },
    geometry: feature.geometry,
    tippecanoe,
  };

  const name = newFeature.properties.name;

  const storedFeature = Features.get(name);

  if (storedFeature == null) {
    Features.set(name, newFeature);

    logger.info({}, 'HandlePlaceLabels:End');
    return newFeature;
  }

  const zoom = newFeature.tippecanoe.minzoom;

  if (zoom < storedFeature.tippecanoe.minzoom) {
    storedFeature.tippecanoe.minzoom = zoom;
    Features.set(name, storedFeature);
  }

  if (zoom > storedFeature.tippecanoe.maxzoom) {
    storedFeature.tippecanoe.maxzoom = zoom;
    Features.set(name, storedFeature);
  }

  // REVIEW: this code doesn't make sense as 'kind' is a string.
  if (newFeature.properties.kind > storedFeature.properties.kind) {
    storedFeature.properties.kind = newFeature.properties.kind;
    Features.set(name, storedFeature);
  }

  logger.info({}, 'HandlePlaceLabels:End');
  return storedFeature;
}

/**
 * Logic to tag gazetteer data based on the styles.
 * @param style from gazetteer data
 */
function convertStyle(style: string, minzoom: number): string {
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
