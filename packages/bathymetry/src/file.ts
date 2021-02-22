import * as fs from 'fs';
import * as path from 'path';

const PrefixMade: Record<string, boolean> = {};

const BathyTempFolder = '.bathy';

export const enum FileType {
    Output = 'output',
    Hash = 'hash',
    Warped = 'warped',
    HillShade = 'hillshade',
    Rendered = 'rendered',
    Stac = 'stac',
    SourceTiff = 'sourceTiff',
}

const SuffixMap: Partial<Record<FileType, string>> = {
    [FileType.Hash]: 'multihash',
    [FileType.Stac]: 'json',
    [FileType.Rendered]: 'png',
};

export class FilePath {
    sourcePath: string;

    constructor(sourcePath: string) {
        this.sourcePath = sourcePath;
    }
    /**
     * Determine the basename for a file type
     */
    basename(fileType: FileType, id = String(fileType)): string {
        const suffix = SuffixMap[fileType] ?? 'tiff';
        return `${id}.${suffix}`;
    }

    /**
     *  Create some temp files and folders
     *
     *  output into folder ./output
     *  temp files into temp folder ./.bathy/
     */
    name(fileType: FileType, id = String(fileType)): string {
        const basename = this.basename(fileType, id);

        let tempPath = this.sourcePath;

        if (fileType === FileType.Output || fileType === FileType.Stac) {
            tempPath = path.join(tempPath, FileType.Output);
        } else {
            tempPath = path.join(tempPath, BathyTempFolder, fileType);
        }
        if (PrefixMade[tempPath] == null) {
            fs.mkdirSync(tempPath, { recursive: true });
            PrefixMade[tempPath] = true;
        }
        return `${tempPath}/${basename}`;
    }
}
