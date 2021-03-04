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
