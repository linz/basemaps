/**
 * Components of a tile set name
 *
 * @example
 * `name:layer`
 * `aerial:tasman_rural_2018-19_0-3m`
 */
export interface TileSetNameComponents {
    name: string;
    /** @default  Production @see TileMetadataNamedTag.Production */
    layer?: string;
}

export const TileSetNameParser = {
    /**
     * Parse a tile set tag combo into their parts
     *
     * @example
     * aerial@head => {name: aerial, tag: head}
     * aerial@head:tasman_rural_2018-19_0-3m => {name: aerial, tag: head, layer: tasman_rural_2018-19_0-3m}
     *
     * @param name String to parse
     */
    parse(name: string): TileSetNameComponents {
        const output: TileSetNameComponents = { name };
        const layerIndex = name.indexOf(':');

        if (layerIndex !== -1) {
            output.layer = output.name.substring(layerIndex + 1);
            output.name = output.name.substring(0, layerIndex);
        }

        return output;
    },

    componentsToName(components: TileSetNameComponents): string {
        return TileSetNameParser.toName(components.name, components.layer);
    },

    toName(name: string, layer?: string): string {
        const output = [name];
        if (layer) output.push(`:${layer}`);
        return output.join('');
    },
};
