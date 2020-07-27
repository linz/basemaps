import { Bounds, Epsg } from '@basemaps/geo';
import {
    Aws,
    ProjectionTileMatrixSet,
    RecordPrefix,
    TileMetadataTable,
    TileSetNameValues,
    TileSetRuleImagery,
} from '@basemaps/shared';
import { TileSet } from './tile.set';

export const TileSets = new Map<string, TileSet>();

export function getTileSet(name: string, projection: Epsg): TileSet | undefined {
    const tileSetId = `${name}_${projection}`;
    return TileSets.get(tileSetId);
}

/**
 * Make a tileSet name nicer to display as a Title
 * @example
 *  'tasman_rural_2018-19_0-3m' => 'Tasman rural 2018-19 0.3m'
 */
function titleizeName(name: string): string {
    return name[0].toUpperCase() + name.slice(1).replace(/_0-/g, ' 0.').replace(/_/g, ' ');
}

function individualTileSet(parent: TileSet, image: TileSetRuleImagery, setId?: string): TileSet {
    const { id } = image.imagery;
    if (setId == null) {
        setId = TileMetadataTable.unprefix(RecordPrefix.Imagery, id);
    }
    const copy = new TileSet(setId, parent.projection);
    // use parent data as prototype for child;
    copy.tileSet = Object.create(parent.tileSet ?? null);
    copy.tileSet.background = undefined;

    copy.titleOverride = `${parent.title} ${titleizeName(image.imagery.name)}`;
    copy.extentOverride = Bounds.fromJson(image.imagery.bounds);

    const rule = {
        id,
        minZoom: 0,
        maxZoom: image.rule.maxZoom,
        priority: 0,
    };
    copy.tileSet.imagery = { [id]: rule };

    copy.imagery = [
        {
            rule,
            imagery: image.imagery,
        },
    ];

    return copy;
}

/**
 * Load a single Tileset from cache or DB

 * @param name consisting of the `TileSetName` with optional `@tag` and `:subset_name`. When a
 * subset name is present its id will be looked up from the parent tileSet.

 * Example: `aerial@beta:tasman_rural_2018-19_0-3m`

 * @param projection find TileSet for this projection.
 */
export async function loadTileSet(name: string, projection: Epsg): Promise<TileSet | null> {
    const subsetIndex = name.indexOf(':');
    const subsetName = subsetIndex == -1 ? '' : name.slice(subsetIndex + 1);
    if (subsetName !== '') {
        name = name.slice(0, subsetIndex);
    }
    let tileSet = getTileSet(name, projection);
    if (tileSet == null) {
        tileSet = new TileSet(name, projection);
        TileSets.set(tileSet.id, tileSet);
    }
    const loaded = await tileSet.load();
    if (!loaded) {
        TileSets.delete(tileSet.id);
        return null;
    }
    if (subsetName !== '') {
        const image = tileSet.imagery.find((i) => i.imagery.name === subsetName);
        if (image == null) return null;
        const subTileSet = individualTileSet(tileSet, image);
        return subTileSet;
    }
    return tileSet;
}

function compareByTitle(a: TileSet, b: TileSet): number {
    return a.title.localeCompare(b.title);
}

/**
 * Load a collection of TileSets. Used by WMTSCapabilities

 * @param nameStr if an empty string load all TileSets
 * @param projection if null load all projections
 */
export async function loadTileSets(nameStr: string, projection: Epsg | null): Promise<TileSet[]> {
    if (nameStr !== '' && nameStr[0] !== '@' && projection != null) {
        // single tileSet
        const ts = await loadTileSet(nameStr, projection);

        return ts == null ? [] : [ts];
    }

    const isSubset = nameStr.indexOf(':') != -1;

    const { name, tag } = Aws.tileMetadata.TileSet.parse(nameStr);

    const projections: Epsg[] =
        projection == null ? Array.from(ProjectionTileMatrixSet.targetCodes()).map((c) => Epsg.get(c)) : [projection];
    const names = name === '' ? TileSetNameValues().map((tsn) => (tag == null ? tsn : `${tsn}@${tag}`)) : [nameStr];

    const promises: Promise<TileSet | null>[] = [];

    for (const n of names) {
        for (const p of projections) {
            promises.push(loadTileSet(n, p));
        }
    }

    const tileSets: TileSet[] = [];
    for (const parent of await Promise.all(promises)) {
        if (parent != null) {
            tileSets.push(parent);
            if (isSubset) {
                parent.name = nameStr;
            } else if (parent.imagery != null && parent.imagery.length > 1) {
                for (const image of parent.imagery) {
                    tileSets.push(individualTileSet(parent, image, parent.taggedName + ':' + image.imagery.name));
                }
            }
        }
    }

    return tileSets.sort(compareByTitle);
}
