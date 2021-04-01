import { Bounds, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import {
    Aws,
    RecordPrefix,
    TileMetadataImageryRecord,
    TileMetadataTable,
    TileSetNameParser,
    TileSetNameValues,
    titleizeImageryName,
} from '@basemaps/shared';
import { TileSet } from './tile.set';
import { TileSetRaster } from './tile.set.raster';
import { TileSetVector } from './tile.set.vector';

export class TileSetCache {
    cache: Map<string, Promise<TileSet | null>> = new Map();

    id(tileSet: TileSet): string;
    id(name: string, tileMatrix: TileMatrixSet): string;
    id(name: string | TileSet, tileMatrix?: TileMatrixSet): string {
        if (typeof name === 'string') {
            const nameComp = TileSetNameParser.parse(name);
            return `${TileSetNameParser.componentsToName(nameComp)}_${tileMatrix?.identifier}`;
        }

        return `${name.fullName}_${name.tileMatrix.identifier}`;
    }

    add(tileSet: TileSet): void {
        const id = this.id(tileSet);
        if (this.cache.has(id)) throw new Error('Trying to add duplicate tile set:' + id);
        this.cache.set(id, Promise.resolve(tileSet));
    }

    get(name: string, tileMatrix: TileMatrixSet): Promise<TileSet | null> {
        const tsId = this.id(name, tileMatrix);
        let existing = this.cache.get(tsId);
        if (existing == null) {
            existing = this.loadTileSet(name, tileMatrix);
            this.cache.set(tsId, existing);
        }
        return existing;
    }

    private async loadTileSet(name: string, tileMatrix: TileMatrixSet): Promise<TileSet | null> {
        const nameComp = TileSetNameParser.parse(name);
        const tileSetId = this.id(name, tileMatrix);

        const tileSet = await Aws.tileMetadata.TileSet.get(nameComp.name, tileMatrix.projection, nameComp.tag);
        if (tileSet == null) {
            this.cache.delete(tileSetId);
            return null;
        }

        if (Aws.tileMetadata.TileSet.isRasterRecord(tileSet)) {
            const ts = new TileSetRaster(name, tileMatrix);
            ts.tileSet = tileSet;
            return ts;
        }
        const ts = new TileSetVector(name, tileMatrix);
        ts.tileSet = tileSet;
        return ts;
    }

    async getAll(name: string, tileMatrix?: TileMatrixSet | null): Promise<TileSet[]> {
        const nameComp = TileSetNameParser.parse(name);
        const tileMatrices = tileMatrix == null ? Array.from(TileMatrixSets.Defaults.values()) : [tileMatrix];
        const names =
            nameComp.name === ''
                ? TileSetNameValues().map((tsn) => TileSetNameParser.toName(tsn, nameComp.tag))
                : [name];

        const promises: Promise<TileSet | null>[] = [];
        for (const n of names) {
            for (const tileMatrix of tileMatrices) {
                promises.push(this.get(n, tileMatrix));
            }
        }
        const tileMatrixSets = await Promise.all(promises);
        const tileSets: TileSetRaster[] = [];
        for (const parent of tileMatrixSets) {
            if (parent == null) continue;
            if (parent.type === 'vector') continue;

            tileSets.push(parent);
            if (nameComp.layer != null) {
                parent.components.name = nameComp.name;
            } else if (parent.imagery != null && parent.imagery.size > 1) {
                for (const image of parent.imagery.values()) {
                    tileSets.push(individualTileSet(parent, image, parent.fullName));
                }
            }
        }
        return tileSets.sort((a, b) => a.title.localeCompare(b.title));
    }
}

export const TileSets = new TileSetCache();

function individualTileSet(parent: TileSetRaster, image: TileMetadataImageryRecord, setId?: string): TileSetRaster {
    const { id } = image;
    if (setId == null) setId = TileMetadataTable.unprefix(RecordPrefix.Imagery, id);
    const copy = new TileSetRaster(setId, parent.tileMatrix);
    // use parent data as prototype for child;
    copy.tileSet = Object.create(parent.tileSet ?? null);
    copy.tileSet.background = undefined;

    copy.titleOverride = `${parent.tileSet.title} ${titleizeImageryName(image.name)}`;
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
