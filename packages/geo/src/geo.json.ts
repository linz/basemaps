import type { FeatureCollection, Feature, Position, MultiPolygon, Polygon } from 'geojson';

export const GeoJson = {
    /**
     * Join a list of features into a Feature collection
     * @param features
     */
    toFeatureCollection(features: Feature[]): FeatureCollection {
        return {
            type: 'FeatureCollection',
            features,
        };
    },

    toPositionPolygon(bbox: number[]): Position[][] {
        return [
            [
                // Use the right-hand-rule (counter-clockwise)
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
            ],
        ];
    },

    toPolygon(coordinates: Position[][]): Polygon {
        return {
            type: 'Polygon',
            coordinates,
        };
    },

    /** Create a feature polygon */
    toFeaturePolygon(coordinates: Position[][], properties = {}): Feature {
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates,
            },
            properties,
        };
    },

    /**
     * Create a feature mult-polygon
     */
    toFeatureMultiPolygon(coordinates: Position[][][], properties = {}): Feature {
        return {
            type: 'Feature',
            geometry: {
                type: 'MultiPolygon',
                coordinates,
            },
            properties,
        };
    },

    /**
     * Convert polygons inside features to one MultiPolygon
     *
     * **This only converts Polygon or MultiPolygon**
     *
     * @param features list of features to convert
     * @param removeHoles remove any holes in the polygons
     */
    toMultiPolygon(features: Feature[], removeHoles = false): MultiPolygon {
        const coordinates: Position[][][] = [];
        for (const feature of features) {
            if (feature.geometry.type == 'Polygon') {
                const poly = feature.geometry.coordinates;
                coordinates.push(removeHoles ? [poly[0]] : poly);
            }
            if (feature.geometry.type == 'MultiPolygon') {
                for (const poly of feature.geometry.coordinates) {
                    coordinates.push(removeHoles ? [poly[0]] : poly);
                }
            }
        }

        return {
            type: 'MultiPolygon',
            coordinates,
        };
    },
};
