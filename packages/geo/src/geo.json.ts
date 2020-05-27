import type * as GeoJSON from 'geojson';

export const GeoJson = {
    /**
     * Join a list of features into a Feature collection
     * @param features
     */
    toFeatureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
        return {
            type: 'FeatureCollection',
            features,
        };
    },

    toPositionPolygon(bbox: [number, number, number, number]): GeoJSON.Position[][] {
        return [
            [
                [bbox[0], bbox[1]],
                [bbox[0], bbox[3]],
                [bbox[2], bbox[3]],
                [bbox[2], bbox[1]],
                [bbox[0], bbox[1]],
            ],
        ];
    },

    toPolygon(coordinates: GeoJSON.Position[][]): GeoJSON.Polygon {
        return {
            type: 'Polygon',
            coordinates,
        };
    },

    /** Create a feature polygon */
    toFeaturePolygon(coordinates: GeoJSON.Position[][], properties = {}): GeoJSON.Feature {
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
    toFeatureMultiPolygon(coordinates: GeoJSON.Position[][][], properties = {}): GeoJSON.Feature {
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
    toMultiPolygon(features: GeoJSON.Feature[], removeHoles = false): GeoJSON.MultiPolygon {
        const coordinates: GeoJSON.Position[][][] = [];
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
