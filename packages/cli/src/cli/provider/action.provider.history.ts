import { Config } from '@basemaps/shared';
import { CommandLineAction } from '@rushstack/ts-command-line';
import { ConfigProvider } from 'packages/config/src/config/provider';
import { ConfigTag } from 'packages/config/src/config/tag';
import { CliTable } from '../cli.table';
import { printProvider } from './provider.util';

const MaxHistory = 199;

export class ProviderHistoryAction extends CommandLineAction {
    public constructor() {
        super({
            actionName: 'log',
            summary: 'Show history for the provider details',
            documentation: '',
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected onDefineParameters(): void {}

    async getAllTags(): Promise<Map<ConfigTag, ConfigProvider>> {
        const allTags: Map<ConfigTag, ConfigProvider> = new Map();
        await Promise.all(
            Object.values(Config.Tag).map(async (tag) => {
                const value = await Config.Provider.get(Config.Provider.id({ name: 'main' }, tag));
                if (value != null) allTags.set(tag, value);
            }),
        );

        return allTags;
    }

    protected async onExecute(): Promise<void> {
        const allTags = await this.getAllTags();

        const data = allTags.get(Config.Tag.Head);
        if (data == null) throw new Error('Unable to find tag: head');

        printProvider(data);

        const latestVersion = data.revisions ?? 0;
        const startVersion = Math.max(latestVersion - MaxHistory, 0);

        const toFetch = new Set<string>();
        for (let i = latestVersion; i >= startVersion; i--) {
            toFetch.add(Config.Provider.id({ name: 'main' }, i));
        }

        function getTagsForVersion(version: number): string {
            return Object.values(Config.Tag)
                .filter((c) => allTags.get(c)?.version === version)
                .join(', ');
        }

        const pvSets = await Config.Provider.getAll(toFetch);

        const pvHistory = new CliTable<ConfigProvider>();
        pvHistory.field('v', 4, (obj) => `v${obj.version}`);
        pvHistory.field('CreatedAt', 40, (obj) => new Date(obj.createdAt).toISOString());
        pvHistory.field('Tags', 40, (obj) => getTagsForVersion(obj.version));

        console.log('History:');
        pvHistory.header();

        for (let i = latestVersion; i >= startVersion; i--) {
            const tileSetId = Config.Provider.id({ name: 'main' }, i);
            const tileSetA = pvSets.get(tileSetId);
            if (tileSetA == null) throw new Error(`Failed to fetch tag: ${tileSetId}`);
            console.log(pvHistory.line(tileSetA));
        }
    }
}
