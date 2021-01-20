import { TileMetadataNamedTag } from '@basemaps/shared';

const validTags = Object.values(TileMetadataNamedTag).filter((f) => f != TileMetadataNamedTag.Head);

/** Commonly used definitions for cli args */
export const TagActions = {
    Version: {
        argumentName: 'VERSION',
        parameterLongName: '--version',
        parameterShortName: '-v',
        description: 'Version ID',
        required: false,
    },
    Commit: {
        parameterLongName: '--commit',
        description: 'Commit to database',
        required: false,
    },
    Tag: {
        argumentName: 'TAG',
        parameterLongName: '--tag',
        parameterShortName: '-t',
        description: `tag name  (options: ${validTags.join(', ')} or pr-<pr_number>)`,
        required: false,
    },
    Imagery: {
        argumentName: 'IMAGERY',
        parameterLongName: '--imagery',
        parameterShortName: '-i',
        description: 'Imagery ID',
        required: false,
    },
    TileSet: {
        argumentName: 'TILE_SET',
        parameterLongName: '--tileset-name',
        parameterShortName: '-n',
        description: 'Tileset name to use',
        required: false,
    },
    Projection: {
        argumentName: 'PROJECTION',
        parameterLongName: '--projection',
        parameterShortName: '-p',
        description: 'Projection to use',
        required: false,
    },
} as const;
