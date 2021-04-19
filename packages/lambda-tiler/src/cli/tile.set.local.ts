import { FileProcessor, FileOperator, LogConfig } from '@basemaps/shared';
import { ChunkSource } from '@cogeotiff/chunk';
import { CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { SourceFile } from '@cogeotiff/source-file';
import { TileSetRaster } from '../tile.set.raster';
import { Epsg, GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

function getTiffs(fs: FileProcessor, tiffList: string[]): ChunkSource[] {
    if (FileOperator.isS3Processor(fs)) {
        return tiffList.map((path) => {
            const { bucket, key } = fs.parse(path);
            if (key == null) throw new Error(`Unable to find tiff: ${path}`);
            // Use the same s3 credentials to access the files that were used to list them
            return new SourceAwsS3(bucket, key, fs.s3);
        });
    }
    return tiffList.map((path) => new SourceFile(path));
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
        const tiffFs = FileOperator.create(this.filePath);

        const fileList = isTiff(this.filePath)
            ? [this.filePath]
            : await FileOperator.toArray(tiffFs.list(this.filePath));
        const files = fileList.filter(isTiff);
        if (files.length === 0 && !FileOperator.isS3(this.filePath)) {
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

        this.tiffs = getTiffs(tiffFs, files).map((c) => new CogTiff(c));

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
