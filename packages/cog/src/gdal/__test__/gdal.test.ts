import * as o from 'ospec';
import { GdalCogBuilder } from '../gdal';
import { normalizeAwsEnv } from '../gdal.command';

o.spec('GdalCogBuilder', () => {
    o('should default all options', () => {
        const builder = new GdalCogBuilder('/foo', 'bar.tiff');

        o(builder.config.bbox).equals(undefined);
        o(builder.config.compression).equals('webp');
        o(builder.config.resampling).equals('cubic');
        o(builder.config.blockSize).equals(512);
        o(builder.config.alignmentLevels).equals(1);
    });

    o('should create a docker command', () => {
        const builder = new GdalCogBuilder('/foo/foo.tiff', '/bar/bar.tiff');

        const args = builder.args;

        o(args.includes('TILING_SCHEME=GoogleMapsCompatible')).equals(true);
        o(args.includes('COMPRESS=webp')).equals(true);
        o(builder.args.includes('BLOCKSIZE=512')).equals(true);

        builder.config.compression = 'jpeg';
        o(builder.args.includes('COMPRESS=jpeg')).equals(true);

        builder.config.blockSize = 256;
        o(builder.args.includes('BLOCKSIZE=256')).equals(true);
    });

    o('should normalize aws environment vars', () => {
        const env = normalizeAwsEnv({ AWS_PROFILE: 'lake' });
        o(env).deepEquals({ AWS_PROFILE: 'lake', AWS_DEFAULT_PROFILE: 'lake' });
    });

    o('should error if aws config is not sane', () => {
        o(() => normalizeAwsEnv({ AWS_PROFILE: 'lake', AWS_DEFAULT_PROFILE: 'other-lake' })).throws(Error);
    });
});
