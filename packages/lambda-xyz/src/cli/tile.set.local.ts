import { FileProcessor, FileOperatorS3, FileOperator, LogConfig } from '@basemaps/shared';
import { CogSource, CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { TileSet } from '../tile.set';
import { Epsg } from '@basemaps/geo';

function getTiffs(fs: FileProcessor, tiffList: string[]): CogSource[] {
    if (fs instanceof FileOperatorS3) {
        return tiffList.map((path) => {
            const { bucket, key } = FileOperatorS3.parse(path);
            // Use the same s3 credentials to access the files that were used to list them
            return new CogSourceAwsS3(bucket, key, fs.s3);
        });
    }
    return tiffList.map((path) => new CogSourceFile(path));
}

function isTiff(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.tif') || fileName.toLowerCase().endsWith('.tiff');
}

export class TileSetLocal extends TileSet {
    tiffs: CogTiff[];
    filePath: string;
    tileSet = {} as any;

    constructor(name: string, projection: Epsg, path: string) {
        super(name, projection);
        this.filePath = path;
        this.tileSet.name = name;
        this.tileSet.title = name;
        this.tileSet.projection = projection.code;
    }

    setTitle(name: string): void {
        this.tileSet.title = name;
    }

    async load(): Promise<boolean> {
        if (this.tiffs != null) return true;
        const tiffFs = FileOperator.create(this.filePath);

        const fileList = isTiff(this.filePath) ? [this.filePath] : await tiffFs.list(this.filePath);
        const files = fileList.filter(isTiff);
        if (files.length == 0) throw new Error(`No tiff files found in ${this.filePath}`);

        this.tiffs = getTiffs(tiffFs, files).map((c) => new CogTiff(c));

        // Read in the projection information
        const [firstTiff] = this.tiffs;
        await firstTiff.init(true);
        const projection = firstTiff.getImage(0).valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
        this.projection = Epsg.get(projection);
        LogConfig.get().info(
            { path: this.filePath, count: this.tiffs.length, projection: this.projection },
            'LoadedTiffs',
        );
        return true;
    }

    getTiffsForQuadKey(): CogTiff[] {
        return this.tiffs;
    }
}
