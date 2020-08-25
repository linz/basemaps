export const StacVersion = '1.0.0';
export const StacLicense = 'CC-BY-4.0';

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
    url: string;
}

export interface StacObject {
    /** Unique processing Id */
    id: string;

    stac_version: string;

    links: StacLink[];

    stac_extensions?: string[];
}

export interface StacCollection<S = Record<string, any>> extends StacObject {
    title: string;
    description?: string;

    license: string;

    extent: {
        spatial: {
            bbox: [number, number, number, number];
        };
        temporal?: {
            interval: [string, string][];
        };
    };

    keywords?: string[];

    providers?: StacProvider[];

    summaries: S;
}

export interface StacItem<P = Record<string, unknown>> extends StacObject, GeoJSON.Feature<GeoJSON.Geometry, P> {
    id: string;
    collection: string;
    links: StacLink[];
    assets: Record<string, StacAsset>;
}
