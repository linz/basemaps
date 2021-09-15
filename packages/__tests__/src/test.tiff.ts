import { CogTiff } from '@cogeotiff/core';
import { SourceFile } from '@cogeotiff/source-file';
import path, { join } from 'path';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const TestDataPath = join(__dirname, '../static');

const TiffGooglePath = join(TestDataPath, 'rgba8.google.tiff');
const TiffNztm2000Path = join(TestDataPath, 'rgba8.nztm2000.tiff');

export class TestTiff {
    static get Nztm2000(): CogTiff {
        return new CogTiff(new SourceFile(TiffNztm2000Path));
    }

    static get Google(): CogTiff {
        return new CogTiff(new SourceFile(TiffGooglePath));
    }
}
