import { GdalCogBuilder } from '../gdal';

jest.mock('child_process');

describe('GdalCogBuilder', () => {
    it('should default all options', () => {
        const builder = new GdalCogBuilder('/foo', 'bar.tiff');

        expect(builder.config.bbox).toEqual(undefined);
        expect(builder.config.compression).toEqual('webp');
        expect(builder.config.resampling).toEqual('lanczos');
        expect(builder.config.blockSize).toEqual(512);
        expect(builder.config.alignmentLevels).toEqual(1);
    });

    it('should create a docker command', () => {
        const builder = new GdalCogBuilder('/foo/foo.tiff', '/bar/bar.tiff');

        const args = builder.args;

        expect(args.includes('TILING_SCHEME=GoogleMapsCompatible')).toEqual(true);
        expect(args.includes('COMPRESS=webp')).toEqual(true);
        expect(builder.args.includes('BLOCKSIZE=512')).toEqual(true);

        builder.config.compression = 'jpeg';
        expect(builder.args.includes('COMPRESS=jpeg')).toEqual(true);

        builder.config.blockSize = 256;
        expect(builder.args.includes('BLOCKSIZE=256')).toEqual(true);
    });
});
