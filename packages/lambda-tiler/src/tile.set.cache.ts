import { TileSetNameParser } from '@basemaps/config';
import { TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Config } from '@basemaps/shared';
import { TileSet } from './tile.set';
import { TileSetRaster } from './tile.set.raster';
import { TileSetVector } from './tile.set.vector';

export class TileSetCache {
    /** Duration to cache tile sets for */
    CacheTime = 30_000;

    /** Cache the fetch requests */
    cache: Map<string, { time: number; value: Promise<TileSet | null> }> = new Map();
    /** Cache initialized tile sets */
    tileSets: Map<string, TileSet> = new Map();

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
        this.cache.set(id, { time: Date.now(), value: Promise.resolve(tileSet) });
    }

    get(name: string, tileMatrix: TileMatrixSet): Promise<TileSet | null> {
        const tsId = this.id(name, tileMatrix);
        let existing = this.cache.get(tsId);
        // Validate the data is current every ~30 seconds
        if (existing == null || Date.now() - existing.time > this.CacheTime) {
            const value = this.loadTileSet(name, tileMatrix);
            existing = { time: Date.now(), value };
            this.cache.set(tsId, existing);
        }
        return existing.value;
    }

    async loadTileSet(name: string, tileMatrix: TileMatrixSet): Promise<TileSet | null> {
        const nameComp = TileSetNameParser.parse(name);
        const tileSetId = this.id(name, tileMatrix);

        if (nameComp.layer != null) {
            const parentName = TileSetNameParser.componentsToName({ ...nameComp, layer: undefined });
            const parent = await this.get(parentName, tileMatrix);
            if (parent == null || parent.isVector()) return null;
            return parent.child(nameComp.layer);
        }

        const dbId = Config.TileSet.id(name);
        const tileSet = await Config.TileSet.get(dbId);
        if (tileSet == null) {
            this.cache.delete(tileSetId);
            return null;
        }

        // If we already have a copy and it hasn't been modified just return it
        const existing = this.tileSets.get(tileSet.id);
        if (existing?.tileSet.updatedAt === tileSet.updatedAt) {
            return existing;
        }

        if (Config.TileSet.isRaster(tileSet)) {
            const ts = new TileSetRaster(name, tileMatrix);
            await ts.init(tileSet);
            this.tileSets.set(tileSet.id, ts);
            return ts;
        }

        const ts = new TileSetVector(name, tileMatrix);
        ts.tileSet = tileSet;
        this.tileSets.set(tileSet.id, ts);
        return ts;
    }

    async getAll(name: string, tileMatrix?: TileMatrixSet | null): Promise<TileSet[]> {
        const nameComp = TileSetNameParser.parse(name);
        const tileMatrices = tileMatrix == null ? Array.from(TileMatrixSets.Defaults.values()) : [tileMatrix];

        const promises: Promise<TileSet | null>[] = [];
        for (const tileMatrix of tileMatrices) promises.push(this.get(name, tileMatrix));

        const tileMatrixSets = await Promise.all(promises);
        const tileSets: TileSetRaster[] = [];
        for (const parent of tileMatrixSets) {
            if (parent == null) continue;
            if (parent.isVector()) continue;

            tileSets.push(parent);
            if (nameComp.layer != null) {
                parent.components.name = nameComp.name;
            } else if (parent.imagery != null && parent.imagery.size > 1) {
                for (const imageId of parent.imagery.keys()) tileSets.push(parent.child(imageId));
            }
        }
        return tileSets.sort((a, b) => a.title.localeCompare(b.title));
    }
}

export const TileSets = new TileSetCache();
