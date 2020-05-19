import { TileMetadataTag } from '@basemaps/lambda-shared';

export const TagAction = {
    onDefineParameters(self: any): void {
        self.version = self.defineIntegerParameter({
            argumentName: 'VERSION',
            parameterLongName: '--version',
            parameterShortName: '-v',
            description: 'Version ID',
            required: false,
        });

        const validTags = Object.values(TileMetadataTag).filter((f) => f != TileMetadataTag.Head);
        self.tag = self.defineStringParameter({
            argumentName: 'TAG',
            parameterLongName: '--tag',
            parameterShortName: '-t',
            description: `tag name  (options: ${validTags.join(', ')})`,
            required: false,
        });

        self.commit = self.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Commit to database',
            required: false,
        });
    },
};
