import { Epsg } from '@basemaps/geo';
import {
    Aws,
    DefaultBackground,
    LogConfig,
    RecordPrefix,
    TileMetadataImageRule,
    TileMetadataImageryRecord,
    TileMetadataNamedTag,
    TileMetadataSetRecord,
    TileMetadataTable,
    TileMetadataTag,
} from '@basemaps/shared';
import { deepStrictEqual } from 'assert';
import { promises as fs } from 'fs';
import { ulid } from 'ulid';
import { addDefaults, assertTileSetConfig, FullImageryConfig, ProjectionConfig } from './tileset.config';
import { invalidateXYZCache, parseRgba, primeImageryCache, rgbaToHex, showDiff } from './tileset.util';

export interface TagChanges {
    name: string;
    projection: Epsg;
    before: TileMetadataSetRecord;
    after: TileMetadataSetRecord;
}

/**
 * All the changes made by applying the TileSetConfig
 */
export interface TilesetChanges {
    changes: TagChanges | null;
    /** A mapping from an id to an imagery record */
    imagery: Map<string, TileMetadataImageryRecord>;
}

function objectsDiffer(a: any, b: any): boolean {
    try {
        deepStrictEqual(a, b);
        return false;
    } catch (err) {}
    return true;
}

interface ImgPriority {
    imgId: string;
    priority: number;
}

function compareImgIdPriority(a: ImgPriority, b: ImgPriority): number {
    if (a.imgId === b.imgId) return b.priority - a.priority;
    return a.imgId < b.imgId ? 1 : -1;
}

function compareIdPriority<T extends { id: string; priority: number }>(a: T, b: T): number {
    if (a.id === b.id) return b.priority - a.priority;
    return a.id < b.id ? 1 : -1;
}

function rulesToMap<T extends ImgPriority>(rules: T[]): Map<string, T[]> {
    const ans = new Map<string, T[]>();
    for (const rule of rules) {
        const entry = ans.get(rule.imgId);
        if (entry == null) {
            ans.set(rule.imgId, [rule]);
        } else {
            entry.push(rule);
        }
    }
    return ans;
}

/**
 * Search for an existing matching rule (using imgId, priority). If not found; remove and return the first one.
 */
function findRule<T extends ImgPriority>(map: Map<string, T[]>, id: string, priority: number): T | null {
    const rules = map.get(TileMetadataTable.prefix(RecordPrefix.Imagery, id));
    if (rules == null) return null;
    for (let i = 0; i < rules.length; ++i) {
        if (rules[i].priority === priority) {
            return rules.splice(i, 1)[0];
        }
    }
    return rules.shift() ?? null;
}

async function showUpdateTag(
    tag: TileMetadataTag,
    changes: TagChanges,
    imagery: Map<string, TileMetadataImageryRecord>,
    isCommit: boolean,
): Promise<string> {
    let output = `\nChanges for ${tag} ${changes.name}/${changes.projection.toEpsgString()}:\n`;
    const backgroundBefore = rgbaToHex(changes.before.background ?? DefaultBackground);
    const backgroundAfter = rgbaToHex(changes.after.background ?? DefaultBackground);
    if (backgroundBefore !== backgroundAfter) {
        output += `\nBackground changed from '${backgroundBefore}' to '${backgroundAfter}'\n`;
    }

    output += showDiff(changes.after, changes.before, imagery);
    await invalidateXYZCache(changes.name, changes.projection, tag, isCommit);
    return output;
}

/**
 * Update the Head and Production config (and tags) to match the config file, Invalidate cloudfront
 *
 * @param filename the config file to apply
 * @param tag the tag to assign to the changes
 * @param isCommit commit changes or just dry run
 */
export async function updateConfig(filename: string, tag: TileMetadataTag, isCommit = false): Promise<void> {
    const configUpdater = new TileSetUpdater((await fs.readFile(filename)).toString(), tag);
    const { changes, imagery } = await configUpdater.reconcile(isCommit);

    if (changes == null) {
        LogConfig.get().info('No Changes');
    } else {
        const output = await showUpdateTag(tag, changes, imagery, isCommit);
        console.log(output);

        if (isCommit) {
            LogConfig.get().info('Changes committed');
        } else {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

export class TileSetUpdater {
    config: ProjectionConfig;
    tag: TileMetadataTag;
    imagery: FullImageryConfig[];
    projection: Epsg;
    /**
     * Class to apply an TileSetConfig source to the tile metadata db

     * @param config a string or TileSetConfig to use
     */
    constructor(config: unknown, tag: TileMetadataTag) {
        if (typeof config === 'string') {
            config = JSON.parse(config);
        }
        assertTileSetConfig(config);
        this.config = config;
        this.tag = tag;
        const defaults = this.config.defaults ?? [];
        this.imagery = this.config.imagery.map((r) => addDefaults(defaults, r)).sort(compareIdPriority);
        this.projection = Epsg.get(config.projection);
    }

    /**
     * Reconcile the differences between the config and the tile metadata DB and tag the new version if changed.

     * @param isCommit if true apply the differences to bring the DB in to line with the config file
     */
    async reconcile(isCommit = false): Promise<TilesetChanges> {
        const imgIds = new Set<string>();

        const { name } = this.config;

        let beforeTs = await this.loadTS(this.tag);
        const newTag = beforeTs.id === '';
        const headTs = this.tag === TileMetadataNamedTag.Head ? beforeTs : await this.loadTS(TileMetadataNamedTag.Head);

        if (newTag) {
            beforeTs = headTs;
        }

        const tagAtHead = headTs.version === beforeTs.version;

        // Only commit the changes if changing head
        const changes = await this.reconcileTileSet(imgIds, beforeTs, tagAtHead ? isCommit : false);
        if (changes != null) {
            if (isCommit && this.tag !== TileMetadataNamedTag.Head) {
                let version = changes.after.version;
                if (!tagAtHead) {
                    // tag has changed but not commited yet; commit now against head
                    const changes = await this.reconcileTileSet(imgIds, headTs, true);
                    if (changes == null) {
                        // changes already applied to head; just tag it
                        version = headTs.version;
                    } else {
                        // tag the new head
                        version = changes.after.version;
                    }
                }
                await Aws.tileMetadata.TileSet.tag(name, this.projection, this.tag, version);
            }
        } else if (newTag) {
            await Aws.tileMetadata.TileSet.tag(name, this.projection, this.tag, headTs.version);
        }

        return { changes, imagery: await primeImageryCache(imgIds) };
    }

    /**
     * Reconcile a tileset with the config.

     * @param imgIds a set of imgIds to add to. These will be loaded later
     * @param beforeTs the current state of the TileSet
     * @param isProdTag is this for the production or head Tag
     * @param isCommit make the actual changes
     */
    private async reconcileTileSet(
        imgIds: Set<string>,
        beforeTs: TileMetadataSetRecord,
        isCommit = false,
    ): Promise<TagChanges | null> {
        for (const rule of beforeTs.rules) {
            imgIds.add(TileMetadataTable.prefix(RecordPrefix.Imagery, rule.imgId));
        }

        const backgroundAfter = this.config.background;
        const backgroundBefore = beforeTs.background && rgbaToHex(beforeTs.background);

        const ruleMap = rulesToMap(beforeTs.rules);

        const afterRules: TileMetadataImageRule[] = [];
        // build the new rules
        for (const ts of this.imagery) {
            const imgId = TileMetadataTable.prefix(RecordPrefix.Imagery, ts.id);
            // blank imgId means not yet created. priority of -1 means remove
            if (imgId !== '' && ts.priority !== -1) {
                const rule = findRule(ruleMap, ts.id, ts.priority);
                const ruleId = rule == null ? TileMetadataTable.prefix(RecordPrefix.ImageryRule, ulid()) : rule.ruleId;
                afterRules.push({
                    imgId,
                    ruleId,
                    priority: ts.priority,
                    minZoom: ts.minZoom,
                    maxZoom: ts.maxZoom,
                });
            }

            imgIds.add(imgId);
        }

        // look for changes
        beforeTs.rules.sort(compareImgIdPriority);
        afterRules.sort(compareImgIdPriority);

        if (objectsDiffer(beforeTs.rules, afterRules) || backgroundAfter !== backgroundBefore) {
            let after: TileMetadataSetRecord = {
                ...beforeTs,
                background: parseRgba(backgroundAfter),
                rules: afterRules,
            };
            if (isCommit) {
                after = await Aws.tileMetadata.TileSet.create(after);
            }
            after.rules = afterRules;
            return {
                name: beforeTs.name,
                projection: Epsg.get(beforeTs.projection),
                before: beforeTs,
                after,
            };
        }
        return null;
    }

    private async loadTS(tag: TileMetadataTag): Promise<TileMetadataSetRecord> {
        const { config, projection } = this;
        const tsData = await Aws.tileMetadata.TileSet.get(config.name, projection, tag);
        if (tsData != null) return tsData;
        return Aws.tileMetadata.TileSet.initialRecord(
            config.name,
            projection.code,
            [],
            config.title,
            config.description,
        );
    }
}
