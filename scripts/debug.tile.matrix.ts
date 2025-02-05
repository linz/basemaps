import { Bounds, Epsg, Nztm2000QuadTms, Projection, ProjectionLoader } from '@basemaps/geo';
import { CliInfo } from '@basemaps/shared/build/cli/info';
import { writeFileSync } from 'fs';

/**
 * Attempt to create a debug tile matrix given a projection code.
 * 
 * General flow of the creaion
 * - Lookup the projection information from spatialreference
 * - Attempt to find the bounds of the projection
 * - Using the bounds attempt to find a tile matrix zoom level that would cover the entire bounds
 * - Create a basic debugging tile matrix from the information
 */


/**
 * Change the projection to create here
 */
const TargetProjection = 3793;


interface ProjJson {
    name: string;
    bbox: {
        south_latitude: number,
        west_longitude: number,
        north_latitude: number,
        east_longitude: number
    }
}
/**
 * Find a zoom level that has approximatly the same bounds as the bounds of the source projection,
 * because the WebMercatorQuad covers the entire world most other projections do not work well, outside
 * their own bounds try and find a zoom level that does not overflow the bounds too much
 * 
 * @param minSize 
 * @returns one zoom level bigger than the minimum zoom level
 */
function findZoomOffset(minSize: number) {
    for (let i = 1; i < Nztm2000QuadTms.maxZoom; i++) {
        const size = Nztm2000QuadTms.pixelScale(i) * 256
        const sizeDiff = minSize - size;
        if (sizeDiff > 0) return Math.max(0, i - 1);
    }
    return 0
}


async function main() {

    await ProjectionLoader.load(TargetProjection);
    const proj = Projection.get(TargetProjection)

    // Load the projection JSON from spatialreference and look for a bounding box of the projection
    const projJson = await fetch(`https://spatialreference.org/ref/epsg/${TargetProjection}/projjson.json`).then(f => f.json()) as ProjJson

    const upperLeft = proj.fromWgs84([projJson.bbox.west_longitude, projJson.bbox.north_latitude])
    const lowerRight = proj.fromWgs84([projJson.bbox.east_longitude, projJson.bbox.south_latitude])

    const minSize = Math.max(Math.abs(upperLeft[0] - lowerRight[0]), Math.abs(upperLeft[1] - lowerRight[1]))
    const zOffset = findZoomOffset(minSize)
    console.log('found zoom offset: ' + zOffset)

    const filePrefix = `./debug-tms-${TargetProjection}`;

    const centerLon = (projJson.bbox.west_longitude + projJson.bbox.east_longitude) / 2
    const centerLat = (projJson.bbox.north_latitude + projJson.bbox.south_latitude) / 2

    const bounds = Bounds.fromUpperLeftLowerRight({ x: projJson.bbox.east_longitude, y: projJson.bbox.north_latitude }, { x: projJson.bbox.west_longitude, y: projJson.bbox.south_latitude })
    const feature = Projection.get(Epsg.Wgs84).boundsToGeoJsonFeature(bounds)

    console.log('Writing bounds', `${filePrefix}-bounds.geojson`)
    writeFileSync(`${filePrefix}-bounds.geojson`, JSON.stringify(feature))

    const tileZeroWidth = Nztm2000QuadTms.pixelScale(zOffset) * 256
    const halfTileZeroWidth = tileZeroWidth / 2;

    const centerProjected = proj.fromWgs84([centerLon, centerLat])

    const tileMatrixBounds = new Bounds(centerProjected[0] - halfTileZeroWidth, centerProjected[1] - halfTileZeroWidth, tileZeroWidth, tileZeroWidth);
    const outputBounds = proj.boundsToGeoJsonFeature(tileMatrixBounds)

    const tileMatrix = structuredClone(Nztm2000QuadTms.def)

    tileMatrix.title = 'Debug tile matrix for EPSG:' + TargetProjection;
    tileMatrix.boundingBox.lowerCorner = [centerProjected[0] - halfTileZeroWidth, centerProjected[1] - halfTileZeroWidth]
    tileMatrix.boundingBox.upperCorner = [centerProjected[0] + halfTileZeroWidth, centerProjected[1] + halfTileZeroWidth]

    tileMatrix.tileMatrix = tileMatrix.tileMatrix.slice(zOffset).map((x, i) => {
        x.identifier = String(i);
        x.matrixWidth = 2 ** i;
        x.matrixHeight = 2 ** i;
        x.topLeftCorner = [tileMatrix.boundingBox.upperCorner[0], tileMatrix.boundingBox.lowerCorner[1]];
        return x;
    })
    tileMatrix.identifier = `Debug_` + projJson.name.replace(/ /g, '').replace(/\//g, '_');
    tileMatrix.supportedCRS = `https://www.opengis.net/def/crs/EPSG/0/${TargetProjection}`
    tileMatrix.boundingBox.crs = tileMatrix.supportedCRS;

    // Log how the tile matrix was generated
    tileMatrix['$generated'] = { ...CliInfo, createdAt: new Date().toISOString() };
    tileMatrix['$options'] = { sourceTileMatrix: Nztm2000QuadTms.identifier, zoomOffset: zOffset }

    console.log('Writing tile matrix', `${filePrefix}-tile-matrix.json`)
    writeFileSync(`${filePrefix}-tile-matrix.json`, JSON.stringify(tileMatrix, null, 2));
}

main().catch(e => { console.error(e); throw e })