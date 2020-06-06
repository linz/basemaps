import { GeoJson, EpsgCode } from '@basemaps/geo';
import { CogJob } from '../types';

export const SourceTiffTestHelper = {
    makeCogJob(): CogJob {
        return {
            projection: EpsgCode.Google,
            source: {
                files: [] as string[],
                resolution: 13,
                path: '',
                options: {
                    maxConcurrency: 3,
                },
            },
            output: {
                vrt: { addAlpha: true },
            },
        } as CogJob;
    },

    tiffPolygons(): GeoJSON.Position[][] {
        return [
            [
                [174.56568549279925, -40.83842049282911],
                [174.57337757492053, -41.162595138463644],
                [174.85931317513828, -41.15833331417625],
                [174.85022498195937, -40.834206771481526],
                [174.56568549279925, -40.83842049282911],
            ],

            [
                [174.85022498195937, -40.834206771481526],
                [174.85931317513828, -41.15833331417625],
                [175.14518230301843, -41.15336229204068],
                [175.13469922175867, -40.829291849263555],
                [174.85022498195937, -40.834206771481526],
            ],
        ];
    },

    polygonsToPaths(polygons: GeoJSON.Position[][]): string[] {
        return polygons.map((_, i): string => `/path/to/tiff${i}.tiff`);
    },

    makeTiffFeatureCollection(polygons?: GeoJSON.Position[][], paths?: string[]): GeoJSON.FeatureCollection {
        if (polygons == null) polygons = SourceTiffTestHelper.tiffPolygons();
        if (paths == null) paths = SourceTiffTestHelper.polygonsToPaths(polygons);
        return GeoJson.toFeatureCollection(
            polygons.map((coords, i) => GeoJson.toFeaturePolygon([coords], { tiff: paths![i] })),
        );
    },
};
