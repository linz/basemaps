import { Epsg } from '@basemaps/geo';

/**
 * Cut down interface, with only the information needed to render a tileset
 */
export interface WmtsLayer {
    name: string;
    title: string;
    description: string;
    projection: Epsg;
    taggedName: string;
}

/** WMTS Provider information */
export interface WmtsProvider {
    version: number;
    serviceIdentification: {
        title: string;
        description: string;
        fees: string;
        accessConstraints: string;
    };
    serviceProvider: {
        name: string;
        site: string;
        contact: {
            individualName: string;
            position: string;
            phone: string;
            address: {
                deliveryPoint: string;
                city: string;
                postalCode: string;
                country: string;
                email: string;
            };
        };
    };
}
