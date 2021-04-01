import { TileMetadataNamedTag, TileMetadataTag } from './aws/tile.metadata.base';

/**
 * Components of a tile set name
 *
 * @example
 * `name@tag:layer`
 * `aerial@head:tasman_rural_2018-19_0-3m`
 */
export interface TileSetNameComponents {
    name: string;
    /** @default  Production @see TileMetadataNamedTag.Production */
    tag: TileMetadataTag;
    layer?: string;
}

export const TileSetNameParser = {
    isValidTag(tagInput: unknown): tagInput is TileMetadataTag {
        return TileSetNameParser.parseTag(tagInput) != null;
    },

    /**
     * Ensure `tagInput` is a valid tag otherwise return null
     */
    parseTag(tagInput: unknown): TileMetadataTag | null {
        if (typeof tagInput !== 'string') return null;
        switch (tagInput) {
            case TileMetadataNamedTag.Head:
            case TileMetadataNamedTag.Production:
            case TileMetadataNamedTag.Beta:
                return tagInput;
            default:
                if (/^pr-[0-9]+$/.test(tagInput)) return tagInput;
                return null;
        }
    },

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
        const output: TileSetNameComponents = { name, tag: TileMetadataNamedTag.Production };
        const layerIndex = name.indexOf(':');

        if (layerIndex !== -1) {
            output.layer = output.name.substring(layerIndex + 1);
            output.name = output.name.substring(0, layerIndex);
        }

        const tagIndex = name.indexOf('@');
        if (tagIndex !== -1) {
            const tag = TileSetNameParser.parseTag(output.name.substring(tagIndex + 1));
            if (tag != null) {
                output.name = output.name.substring(0, tagIndex);
                output.tag = tag;
            }
        }

        return output;
    },

    componentsToName(components: TileSetNameComponents): string {
        return TileSetNameParser.toName(components.name, components.tag, components.layer);
    },

    toName(name: string, tag?: TileMetadataTag | string, layer?: string): string {
        const output = [name];
        if (tag && tag !== TileMetadataNamedTag.Production) output.push(`@${tag}`);
        if (layer) output.push(`:${layer}`);
        return output.join('');
    },
};
