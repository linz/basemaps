/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, TileMetadataSetRecord, TileSetTag } from '@basemaps/lambda-shared';
import { CliTable } from '../cli.table';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet } from './tileset.util';

const MaxHistory = 199;

export class TileSetHistoryAction extends TileSetBaseAction {
    public constructor() {
        super({
            actionName: 'log',
            summary: 'Show rendering history for a tileset',
            documentation: '',
        });
    }

    async getAllTags(): Promise<Map<TileSetTag, TileMetadataSetRecord>> {
        const tileSet = this.tileSet.value!;
        const projection = this.projection.value!;
        const allTags: Map<TileSetTag, TileMetadataSetRecord> = new Map();
        await Promise.all(
            Object.values(TileSetTag).map(async (tag) => {
                try {
                    const value = await Aws.tileMetadata.TileSet.get(tileSet, projection, tag);
                    allTags.set(tag, value);
                } catch (e) {}
            }),
        );

        return allTags;
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = this.projection.value!;

        const allTags = await this.getAllTags();

        const tsData = allTags.get(TileSetTag.Head);
        if (tsData == null) throw new Error('Unable to find tag: head');

        printTileSet(tsData, false);

        const latestVersion = tsData.revisions ?? 0;
        const startVersion = Math.max(latestVersion - MaxHistory, 0);

        const toFetch = new Set<string>();
        for (let i = latestVersion; i >= startVersion; i--) {
            toFetch.add(Aws.tileMetadata.TileSet.id(tileSet, projection, i));
        }

        function getTagsForVersion(version: number): string {
            return Object.values(TileSetTag)
                .filter((c) => allTags.get(c)?.version == version)
                .join(', ');
        }

        const fetchedTags = await Aws.tileMetadata.batchGet<TileMetadataSetRecord>(toFetch);

        const TileSetHistory = new CliTable<TileMetadataSetRecord>();
        TileSetHistory.field('v', 4, (obj) => `v${obj.version}`);
        TileSetHistory.field('CreatedAt', 40, (obj) => new Date(obj.createdAt).toISOString());
        TileSetHistory.field('Tags', 40, (obj) => getTagsForVersion(obj.version));

        console.log('History:');
        TileSetHistory.header();
        const values = Array.from(toFetch.values()).map((key) => fetchedTags.get(key)!);
        TileSetHistory.print(values);
    }
}
