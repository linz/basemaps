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
}

const SuffixMap: Partial<Record<FileType, string>> = {
    [FileType.Hash]: 'multihash',
    [FileType.Stac]: 'json',
    [FileType.Rendered]: 'png',
};

export class FilePath {
    sourcePath: string;
    fileName: string;

    constructor(sourcePath: string) {
        this.sourcePath = sourcePath;
        this.fileName = path.basename(this.sourcePath);
    }
    /**
     *  Create some temp files and folders
     *
     *  output into folder ./output
     *  temp files into temp folder ./.bathy/
     */
    name(fileType: FileType, id = ''): string {
        const suffix = SuffixMap[fileType] ?? 'tiff';
        let tempPath = path.dirname(this.sourcePath);

        if (fileType == FileType.Output || fileType == FileType.Stac) {
            tempPath = path.join(tempPath, FileType.Output, this.fileName);
        } else {
            tempPath = path.join(tempPath, BathyTempFolder, this.fileName, fileType);
        }
        if (PrefixMade[tempPath] == null) {
            fs.mkdirSync(tempPath, { recursive: true });
            PrefixMade[tempPath] = true;
        }
        const outputId = id == '' ? '' : `-${id}`;
        return `${tempPath}/${this.fileName}${outputId}.${suffix}`;
    }
}
