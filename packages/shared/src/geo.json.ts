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
     * Convert polygons inside features to one MultiPolygon
     *
     * **This only converts Polygon or MultiPolygon**
     *
     * @param features list of features to convert
     */
    toMultiPolygon(features: GeoJSON.Feature[]): GeoJSON.MultiPolygon {
        let coordinates: GeoJSON.Position[][][] = [];
        for (const feature of features) {
            if (feature.geometry.type == 'Polygon') {
                coordinates.push(feature.geometry.coordinates);
            }
            if (feature.geometry.type == 'MultiPolygon') {
                coordinates = coordinates.concat(feature.geometry.coordinates);
            }
        }

        return {
            type: 'MultiPolygon',
            coordinates,
        };
    },
};
