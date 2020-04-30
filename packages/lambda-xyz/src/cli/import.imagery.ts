import { EPSG } from '@basemaps/geo';
import { Aws, LogConfig, TileMetadataImageryRecord, TileMetadataSetRecord } from '@basemaps/lambda-shared';
import 'source-map-support/register';
import './imagery/index';
import { MosaicCog } from './imagery/mosaic.cog';
import { Mosaics } from './imagery/mosaics';

/**
 * Sort a collection of mosaics based on our predetermined priority
 *
 * This needs to be a stable sort or imagery will generate weird
 */
export function MosaicSort(a: MosaicCog, b: MosaicCog): number {
    // Sort by priority, highest on top
    if (a.priority != b.priority) {
        return a.priority - b.priority;
    }

    // Sort by year, newest on top
    if (a.year != b.year) {
        return a.year - b.year;
    }

    // Resolution, highest resolution (lowest number) on top
    if (a.resolution != b.resolution) {
        return b.resolution - a.resolution;
    }

    // If everything is equal use the name to force a stable sort
    return a.basePath.localeCompare(b.basePath);
}

/**
 * CLI to iterate over all imagery sets that have been defined and determine if all the COGS are present and optimized
 */
async function main(): Promise<void> {
    const logger = LogConfig.get();
    const TileSet = Aws.tileMetadata.TileSet;

    Mosaics.sort(MosaicSort);

    const nowIsh = Date.now();

    const AerialTileSet: TileMetadataSetRecord = {
        id: '',
        name: 'aerial',
        projection: EPSG.Google,
        createdAt: nowIsh,
        updatedAt: nowIsh,
        imagery: [],
        version: 0,
    };

    for (const mosaic of Mosaics) {
        const record: TileMetadataImageryRecord = {
            id: `im_${mosaic.id}`,
            projection: EPSG.Google,
            year: mosaic.year,
            resolution: mosaic.resolution,
            name: mosaic.name,
            quadKeys: mosaic.quadKeys,
            createdAt: nowIsh,
            updatedAt: nowIsh,
        };

        AerialTileSet.imagery.push({
            id: record.id,
            maxZoom: mosaic.zoom.max,
            minZoom: mosaic.zoom.min,
        });
        logger.info({ record: record.id }, 'Insert');
        await Aws.tileMetadata.put(record);
    }

    logger.info(
        { record: AerialTileSet.id, records: AerialTileSet.imagery.length, size: JSON.stringify(AerialTileSet).length },
        'InsertTileSet',
    );
    await TileSet.create(AerialTileSet);
}

main().catch((err: Error) => LogConfig.get().fatal({ err }, 'Failed'));
