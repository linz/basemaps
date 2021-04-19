import { ConfigTag } from './config/tag';

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
    tag: ConfigTag;
    layer?: string;
}

export const TileSetNameParser = {
    isValidTag(tagInput: unknown): tagInput is ConfigTag {
        return TileSetNameParser.parseTag(tagInput) != null;
    },

    /**
     * Ensure `tagInput` is a valid tag otherwise return null
     */
    parseTag(tagInput: unknown): ConfigTag | null {
        if (typeof tagInput !== 'string') return null;
        switch (tagInput) {
            case ConfigTag.Head:
            case ConfigTag.Production:
            case ConfigTag.Beta:
                return tagInput;
            default:
                if (/^pr-[0-9]+$/.test(tagInput)) return tagInput as ConfigTag;
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
        const output: TileSetNameComponents = { name, tag: ConfigTag.Production };
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

    toName(name: string, tag?: ConfigTag | string, layer?: string): string {
        const output = [name];
        if (tag && tag !== ConfigTag.Production) output.push(`@${tag}`);
        if (layer) output.push(`:${layer}`);
        return output.join('');
    },
};
