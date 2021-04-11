export type TileMetadataTag = string;

export enum TileMetadataNamedTag {
    /** Version to render by default */
    Production = 'production',

    /** Most recent version */
    Head = 'head',

    /** Pre release testing version */
    Beta = 'beta',
}
