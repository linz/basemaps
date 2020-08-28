/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Aws, LogConfig, TileMetadataImageryRecord, TileMetadataSetRecord, TileMetadataTag } from '@basemaps/shared';
import { CliTable } from '../cli.table';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet, showDiff } from './tileset.util';

const MaxHistory = 199;

export class TileSetHistoryAction extends TileSetBaseAction {
    public constructor() {
        super({
            actionName: 'log',
            summary: 'Show rendering history for a tileset',
            documentation: '',
        });
    }

    async getAllTags(): Promise<Map<TileMetadataTag, TileMetadataSetRecord>> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value ?? -1);
        const allTags: Map<TileMetadataTag, TileMetadataSetRecord> = new Map();
        await Promise.all(
            Object.values(TileMetadataTag).map(async (tag) => {
                try {
                    const value = await Aws.tileMetadata.TileSet.get(tileSet, projection, tag);
                    allTags.set(tag, value);
                } catch (e) {}
            }),
        );

        return allTags;
    }

    protected async onExecute(): Promise<void> {
        const tileSetName = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);

        const allTags = await this.getAllTags();

        const tsData = allTags.get(TileMetadataTag.Head);
        if (tsData == null) throw new Error('Unable to find tag: head');

        printTileSet(tsData, false);

        const latestVersion = tsData.revisions ?? 0;
        const startVersion = Math.max(latestVersion - MaxHistory, 0);

        const toFetch = new Set<string>();
        for (let i = latestVersion; i >= startVersion; i--) {
            toFetch.add(Aws.tileMetadata.TileSet.id(tileSetName, projection, i));
        }

        function getTagsForVersion(version: number): string {
            return Object.values(TileMetadataTag)
                .filter((c) => allTags.get(c)?.version == version)
                .join(', ');
        }

        LogConfig.get().debug({ count: toFetch.size }, 'Loading TileSets');
        const tileSets = await Aws.tileMetadata.TileSet.batchGet(toFetch);
        const toFetchImages = new Set<string>();
        for (const tag of tileSets.values()) {
            for (const rule of tag.rules) toFetchImages.add(rule.imgId);
        }

        LogConfig.get().debug({ count: toFetchImages.size }, 'Loading Imagery');
        const imagery = await Aws.tileMetadata.batchGet<TileMetadataImageryRecord>(toFetchImages);

        for (const tag of tileSets.values()) {
            Aws.tileMetadata.TileSet.sortRenderRules(tag, imagery);
        }

        const TileSetHistory = new CliTable<TileMetadataSetRecord>();
        TileSetHistory.field('v', 4, (obj) => `v${obj.version}`);
        TileSetHistory.field('CreatedAt', 40, (obj) => new Date(obj.createdAt).toISOString());
        TileSetHistory.field('Tags', 40, (obj) => getTagsForVersion(obj.version));

        console.log('History:');
        TileSetHistory.header();

        for (let i = latestVersion; i >= startVersion; i--) {
            const tileSetId = Aws.tileMetadata.TileSet.id(tileSetName, projection, i);
            const tileSetA = tileSets.get(tileSetId);
            if (tileSetA == null) throw new Error(`Failed to fetch tag: ${tileSetId}`);
            console.log(TileSetHistory.line(tileSetA));

            if (i == startVersion) continue;

            const tileSetBId = Aws.tileMetadata.TileSet.id(tileSetName, projection, i - 1);
            const tileSetB = tileSets.get(tileSetBId);
            if (tileSetB == null) throw new Error(`Failed to fetch tag: ${tileSetBId}`);

            console.log(showDiff(tileSetA, tileSetB, imagery));
        }
    }
}
