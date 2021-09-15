import type { FeatureCollection, Feature, Position, MultiPolygon, Polygon } from 'geojson';
import { ConvertCoordinates } from './multipolygon/convert.js';

/**
 * Join a list of features into a Feature collection
 * @param features
 */
export function toFeatureCollection(features: Feature[]): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features,
    };
}

export function toPolygon(coordinates: Position[][]): Polygon {
    return {
        type: 'Polygon',
        coordinates,
    };
}

/** Create a feature polygon */
export function toFeaturePolygon(coordinates: Position[][], properties = {}): Feature {
    return {
        type: 'Feature',
        geometry: toPolygon(coordinates),
        properties,
    };
}

/**
 * Create a feature mult-polygon
 */
export function toFeatureMultiPolygon(coordinates: Position[][][], properties = {}): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates,
        },
        properties,
    };
}

/**
 * Make a copy of point `p`
 */
export const copyPoint: ConvertCoordinates = (p) => [p[0], p[1]];

/**
 * Convert polygons inside features to one MultiPolygon
 *
 * **This only converts Polygon or MultiPolygon**
 *
 * @param features list of features to convert
 * @param removeHoles remove any holes in the polygons
 * @param transform change the coordinates of each point. Defaults to copying the point
 */
export function featuresToMultiPolygon(features: Feature[], removeHoles = false, transform = copyPoint): MultiPolygon {
    const coordinates: Position[][][] = [];
    for (const { geometry } of features) {
        if (geometry.type === 'MultiPolygon') {
            for (const coords of geometry.coordinates) {
                if (removeHoles) {
                    coordinates.push([coords[0].map(transform)]);
                } else {
                    coordinates.push(coords.map((ring) => ring.map(transform)));
                }
            }
        } else if (geometry.type === 'Polygon') {
            if (removeHoles) {
                coordinates.push([geometry.coordinates[0].map(transform)]);
            } else {
                coordinates.push(geometry.coordinates.map((ring) => ring.map(transform)));
            }
        }
    }

    return {
        type: 'MultiPolygon',
        coordinates,
    };
}
