import { LambdaContext, LogConfig, TileMetadataProviderRecord } from '@basemaps/lambda-shared';
import { TileSet } from '../tile.set';

export function mockRequest(path: string, method = 'get', headers = {}): LambdaContext {
    return new LambdaContext(
        {
            requestContext: null as any,
            httpMethod: method.toUpperCase(),
            path,
            headers,
            body: null,
            isBase64Encoded: false,
        },
        LogConfig.get(),
    );
}

export class FakeTileSet extends TileSet {
    protected tileSet = { title: 'The Title', description: 'The Description' } as any;
}

export const Provider: TileMetadataProviderRecord = {
    createdAt: Date.now(),
    id: 'pv_production',
    updatedAt: Date.now(),
    version: 1,
    revisions: 0,
    serviceIdentification: {
        accessConstraints: 'the accessConstraints',
        description: 'the description',
        fees: 'the fees',
        title: 'the title',
    },
    serviceProvider: {
        contact: {
            address: {
                city: 'the city',
                country: 'the country',
                deliveryPoint: 'the deliveryPoint',
                email: 'email address',
                postalCode: 'the postalCode',
            },
            individualName: 'the contact name',
            phone: 'the phone',
            position: 'the position',
        },
        name: 'the name',
        site: 'the site',
    },
};
