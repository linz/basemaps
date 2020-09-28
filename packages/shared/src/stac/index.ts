export const StacVersion = '1.0.0-beta.2';
export const StacLicense = 'CC BY 4.0';
export const StacBaseMapsExtension =
    'https://basemaps.linz.govt.nz/json-schema/stac-basemaps-extension/1.0/schema.json';

export interface StacLink {
    rel: string;
    href: string;
    type?: string;
    [other: string]: any;
}

export interface StacAsset {
    href: string;
    type: string;
    roles: string[];
    title?: string;
    description?: string;
}

export interface StacProvider {
    name: string;
    roles: string[];
    url?: string;
}

export interface StacObject {
    /** Unique processing Id */
    id: string;

    stac_version: '1.0.0-beta.2';

    links: StacLink[];

    stac_extensions?: string[];
}

export interface StacExtent {
    spatial: {
        bbox: [number, number, number, number][];
    };
    temporal: {
        interval: [string, string][];
    };
}

export interface StacCatalog extends StacObject {
    title: string;
    description: string;
}

export interface StacCollection<S = Record<string, any>> extends StacCatalog {
    license: string;

    extent: StacExtent;

    keywords?: string[];

    providers?: StacProvider[];

    summaries: S;
}

export interface StacItem<P = Record<string, unknown>> extends StacObject, GeoJSON.Feature<GeoJSON.Geometry, P> {
    id: string;
    collection?: string;
    bbox: GeoJSON.BBox;
    links: StacLink[];
    assets: Record<string, StacAsset>;
}
