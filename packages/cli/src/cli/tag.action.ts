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
