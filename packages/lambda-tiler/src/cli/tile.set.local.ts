import { Epsg, GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { ChunkSource } from '@cogeotiff/chunk';
import { CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { SourceFile } from '@cogeotiff/source-file';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { TileSetRaster } from '../tile.set.raster.js';

function getTiffs(tiffList: string[]): ChunkSource[] {
    return tiffList.map((path) => {
        if (fsa.isS3(path)) {
            const fs = fsa.find(path);
            if (!fsa.isS3Processor(fs)) throw new Error(`Failed to find file system for: ${path}`);
            const { bucket, key } = fs.parse(path);
            if (key == null) throw new Error(`Unable to find tiff: ${path}`);
            // Use the same s3 credentials to access the files that were used to list them
            return new SourceAwsS3(bucket, key, fs.s3);
        }
        return new SourceFile(path);
    });
}

function isTiff(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.tif') || fileName.toLowerCase().endsWith('.tiff');
}

export class TileSetLocal extends TileSetRaster {
    tiffs: CogTiff[];
    filePath: string;
    tileSet = {} as any;

    constructor(name: string, path: string) {
        super(name, GoogleTms);
        this.filePath = path;
        this.tileSet.name = name;
        this.tileSet.title = name;
        this.tileSet.projection = GoogleTms.projection.code;
    }

    setTitle(name: string): void {
        this.tileSet.title = name;
    }

    async load(): Promise<boolean> {
        if (this.tiffs != null) return true;

        const fileList = isTiff(this.filePath) ? [this.filePath] : await fsa.toArray(fsa.list(this.filePath));
        const files = fileList.filter(isTiff);
        if (files.length === 0 && !fsa.isS3(this.filePath)) {
            for (const dir of fileList.sort()) {
                const st = await fsPromises.stat(dir);
                if (st.isDirectory()) {
                    for (const file of await fsPromises.readdir(dir)) {
                        const filePath = join(dir, file);
                        if (isTiff(filePath)) files.push(filePath);
                    }
                }
            }
        }
        if (files.length === 0) {
            throw new Error(`No tiff files found in ${this.filePath}`);
        }

        this.tiffs = getTiffs(files).map((c) => new CogTiff(c));

        // Read in the projection information
        const [firstTiff] = this.tiffs;
        await firstTiff.init(true);
        const projection = Epsg.get(firstTiff.getImage(0).valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number);
        this.tileMatrix = TileMatrixSets.get(projection);
        LogConfig.get().info(
            { path: this.filePath, count: this.tiffs.length, tileMatrix: this.tileMatrix.identifier },
            'LoadedTiffs',
        );
        return true;
    }

    getTiffsForTile(): CogTiff[] {
        return this.tiffs;
    }
}
