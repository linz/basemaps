import { defineTagParameter } from './basemaps/tileset.util';

export const TagAction = {
    onDefineParameters(self: any): void {
        self.version = self.defineIntegerParameter({
            argumentName: 'VERSION',
            parameterLongName: '--version',
            parameterShortName: '-v',
            description: 'Version ID',
            required: false,
        });

        defineTagParameter(self);

        self.commit = self.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Commit to database',
            required: false,
        });
    },
};
