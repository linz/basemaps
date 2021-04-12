/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ConfigTileSet } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import { CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ConfigTag } from 'packages/config/src/config/tag';
import { CliTable } from '../cli.table';
import { TagActions } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet, showDiff } from './tileset.util';

const MaxHistory = 199;

export class TileSetHistoryAction extends TileSetBaseAction {
    private tileSet: CommandLineStringParameter;
    private projection: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'log',
            summary: 'Show rendering history for a tileset',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
    }

    async getAllTags(): Promise<Map<ConfigTag, ConfigTileSet>> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value ?? -1);
        const allTags: Map<ConfigTag, ConfigTileSet> = new Map();
        await Promise.all(
            Object.values(Config.Tag).map(async (tag) => {
                const id = Config.TileSet.id({ name: tileSet, projection }, tag);
                const value = await Config.TileSet.get(id);
                if (value == null) return;
                allTags.set(tag, value);
            }),
        );

        return allTags;
    }

    protected async onExecute(): Promise<void> {
        const tileSetName = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);

        const allTags = await this.getAllTags();

        const tsData = allTags.get(Config.Tag.Head);
        if (tsData == null) throw new Error('Unable to find tag: head');

        printTileSet(tsData, false);

        const latestVersion = tsData.revisions ?? 0;
        const startVersion = Math.max(latestVersion - MaxHistory, 0);

        const toFetch = new Set<string>();
        for (let i = latestVersion; i >= startVersion; i--) {
            toFetch.add(Config.TileSet.id({ name: tileSetName, projection }, i));
        }

        function getTagsForVersion(version: number): string {
            return Object.values(Config.Tag)
                .filter((c) => allTags.get(c)?.version === version)
                .join(', ');
        }

        LogConfig.get().debug({ count: toFetch.size }, 'Loading TileSets');
        const tileSets = await Config.TileSet.getAll(toFetch);
        const toFetchImages = new Set<string>();
        for (const tag of tileSets.values()) {
            if (!Config.TileSet.isRaster(tag)) continue;
            for (const rule of tag.rules) toFetchImages.add(rule.imgId);
        }

        LogConfig.get().debug({ count: toFetchImages.size }, 'Loading Imagery');
        const imagery = await Config.Imagery.getAll(toFetchImages);

        for (const tag of tileSets.values()) {
            if (!Config.TileSet.isRaster(tag)) continue;
            Config.TileSet.sortRenderRules(tag, imagery);
        }

        const TileSetHistory = new CliTable<ConfigTileSet>();
        TileSetHistory.field('v', 4, (obj) => `v${obj.version}`);
        TileSetHistory.field('CreatedAt', 40, (obj) => new Date(obj.createdAt).toISOString());
        TileSetHistory.field('Tags', 40, (obj) => getTagsForVersion(obj.version));

        console.log('History:');
        TileSetHistory.header();

        for (let i = latestVersion; i >= startVersion; i--) {
            const tileSetId = Config.TileSet.id({ name: tileSetName, projection }, i);
            const tileSetA = tileSets.get(tileSetId);
            if (tileSetA == null) throw new Error(`Failed to fetch tag: ${tileSetId}`);
            console.log(TileSetHistory.line(tileSetA));

            if (i === startVersion) continue;

            const tileSetBId = Config.TileSet.id({ name: tileSetName, projection }, i - 1);
            const tileSetB = tileSets.get(tileSetBId);
            if (tileSetB == null) throw new Error(`Failed to fetch tag: ${tileSetBId}`);

            if (!Config.TileSet.isRaster(tileSetA)) continue;
            if (!Config.TileSet.isRaster(tileSetB)) continue;

            console.log(showDiff(tileSetA, tileSetB, imagery));
        }
    }
}
