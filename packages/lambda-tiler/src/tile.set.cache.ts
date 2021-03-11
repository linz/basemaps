import { Bounds, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import {
    Aws,
    RecordPrefix,
    TileMetadataImageryRecord,
    TileMetadataTable,
    TileSetNameValues,
    titleizeImageryName,
} from '@basemaps/shared';
import { TileSet } from './tile.set';

/** The cached TileSets */
export const TileSets = new Map<string, TileSet>();

/**
 * Get a TileSet from the cache
 */
export function getTileSet(name: string, tileMatrix: TileMatrixSet): TileSet | undefined {
    const tileSetId = `${name}_${tileMatrix.identifier}`;
    const tileSet = TileSets.get(tileSetId);
    if (tileSet != null && tileSet.id !== tileSetId) throw new Error('TileSetId Missmatch: ' + tileSet.id);
    return tileSet;
}

function individualTileSet(parent: TileSet, image: TileMetadataImageryRecord, setId?: string): TileSet {
    const { id } = image;
    if (setId == null) {
        setId = TileMetadataTable.unprefix(RecordPrefix.Imagery, id);
    }
    const copy = new TileSet(setId, parent.tileMatrix);
    // use parent data as prototype for child;
    copy.tileSet = Object.create(parent.tileSet ?? null);
    copy.tileSet.background = undefined;

    copy.titleOverride = `${parent.title} ${titleizeImageryName(image.name)}`;
    copy.extentOverride = Bounds.fromJson(image.bounds);

    const rule = {
        ruleId: TileMetadataTable.prefix(
            RecordPrefix.ImageryRule,
            TileMetadataTable.unprefix(RecordPrefix.Imagery, image.id),
        ),
        imgId: image.id,
        minZoom: 0,
        maxZoom: 100,
        priority: 0,
    };
    copy.tileSet.rules = [rule];
    copy.imagery = new Map();
    copy.imagery.set(image.id, image);

    return copy;
}

/**
 * Load a single Tileset from cache or DB

 * @param name consisting of the `TileSetName` with optional `@tag` and `:subset_name`. When a
 * subset name is present its id will be looked up from the parent tileSet.

 * Example: `aerial@beta:tasman_rural_2018-19_0-3m`

 * @param projection find TileSet for this projection.
 */
export async function loadTileSet(name: string, tileMatrix: TileMatrixSet): Promise<TileSet | null> {
    const subsetIndex = name.indexOf(':');
    const subsetName = subsetIndex === -1 ? '' : name.slice(subsetIndex + 1);
    if (subsetName !== '') {
        name = name.slice(0, subsetIndex);
    }
    let tileSet = getTileSet(name, tileMatrix);
    if (tileSet == null) {
        tileSet = new TileSet(name, tileMatrix);
        TileSets.set(tileSet.id, tileSet);
    }
    const loaded = await tileSet.load();
    if (!loaded) {
        TileSets.delete(tileSet.id);
        return null;
    }

    if (subsetName === '') return tileSet;
    for (const image of tileSet.imagery.values()) {
        if (image.name === subsetName) return individualTileSet(tileSet, image);
    }
    return null;
}

function compareByTitle(a: TileSet, b: TileSet): number {
    return a.title.localeCompare(b.title);
}

/**
 * Load a collection of TileSets. Used by WMTSCapabilities

 * @param nameStr if an empty string load all TileSets
 * @param projection if null load all projections
 */
export async function loadTileSets(nameStr: string, tileMatrix: TileMatrixSet | null): Promise<TileSet[]> {
    const isSubset = nameStr.indexOf(':') !== -1;
    const { name, tag } = Aws.tileMetadata.TileSet.parse(nameStr);

    const tileMatrices: TileMatrixSet[] =
        tileMatrix == null ? Array.from(TileMatrixSets.Defaults.values()) : [tileMatrix];
    const names = name === '' ? TileSetNameValues().map((tsn) => (tag == null ? tsn : `${tsn}@${tag}`)) : [nameStr];

    const promises: Promise<TileSet | null>[] = [];
    for (const n of names) {
        for (const tileMatrix of tileMatrices) {
            promises.push(loadTileSet(n, tileMatrix));
        }
    }

    const tileSets: TileSet[] = [];
    for (const parent of await Promise.all(promises)) {
        if (parent != null) {
            tileSets.push(parent);
            if (isSubset) {
                parent.name = nameStr;
            } else if (parent.imagery != null && parent.imagery.size > 1) {
                for (const image of parent.imagery.values()) {
                    tileSets.push(individualTileSet(parent, image, parent.taggedName + ':' + image.name));
                }
            }
        }
    }

    return tileSets.sort(compareByTitle);
}
