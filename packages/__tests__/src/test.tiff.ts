import { CogTiff } from '@cogeotiff/core';
import { fsa } from '@chunkd/fs';
import path, { join } from 'path';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const TestDataPath = join(__dirname, '../static');

const TiffGooglePath = join(TestDataPath, 'rgba8.google.tiff');
const TiffNztm2000Path = join(TestDataPath, 'rgba8.nztm2000.tiff');

export class TestTiff {
    static get Nztm2000(): CogTiff {
        const source = fsa.source(TiffNztm2000Path);
        if (source == null) throw new Error('Failed to open: ' + TiffNztm2000Path);

        return new CogTiff(source);
    }

    static get Google(): CogTiff {
        const source = fsa.source(TiffGooglePath);
        if (source == null) throw new Error('Failed to open: ' + TiffGooglePath);
        return new CogTiff(source);
    }
}
