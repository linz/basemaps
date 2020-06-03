import { TileMetadataProviderRecord } from '@basemaps/shared';
import * as c from 'ansi-colors';
import { inspect } from 'util';

export function printProvider(data: TileMetadataProviderRecord, changes = data): void {
    const content = {} as any;
    if (changes.serviceProvider != null) content.serviceProvider = changes.serviceProvider;
    if (changes.serviceIdentification != null) content.serviceIdentification = changes.serviceIdentification;

    console.log(c.bold('Title:'), data.serviceProvider.name);
    console.log(c.bold('CreatedAt:'), new Date(data.createdAt).toISOString());
    console.log(c.bold('UpdatedAt:'), new Date(data.updatedAt).toISOString());
    console.log(c.bold('Version:'), `v${data.version}`);
    console.log(c.bold('Content:') + inspect(content, false, 5, true));
}

export const BlankProvider: TileMetadataProviderRecord = {
    createdAt: 0,
    id: '',
    updatedAt: 0,
    version: 0,
    revisions: 0,
    serviceIdentification: {
        accessConstraints: '',
        description: '',
        fees: '',
        title: '',
    },
    serviceProvider: {
        contact: {
            address: {
                city: '',
                country: '',
                deliveryPoint: '',
                email: '',
                postalCode: '',
            },
            individualName: '',
            phone: '',
            position: '',
        },
        name: '',
        site: '',
    },
};

type ProviderSubset = Record<string, any>; // any because can't write circular reference

/**
 * Validate json data `input` and calculate the changes from an `existing` provider record.

 * @returns only the fields that have changed between `input` and `existing`
 * @throws Error if `after` contains invalid Provider data
 */
export function validateProvider(
    input: Record<string, any>,
    existing: TileMetadataProviderRecord,
): TileMetadataProviderRecord | null {
    const changes = {};

    // Recursively validate subsets of TileMetadataProviderRecord
    const validateField = (
        after: Record<string, any>,
        before: Record<string, any>,
        template: Record<string, any>,
        changes: ProviderSubset,
    ): boolean => {
        let hasChanged = false;
        if (typeof after !== 'object') throw 'invalid';
        for (const field in after) {
            if (field in template) {
                const fieldType = typeof template[field];
                if (fieldType === 'object') {
                    const subChanges = {};
                    if (validateField(after[field], before[field], template[field], subChanges)) {
                        changes[field] = subChanges;
                        hasChanged = true;
                    }
                } else if (fieldType !== typeof after[field]) {
                    throw 'invalid';
                } else if (after[field] !== before[field]) {
                    changes[field] = after[field];
                    hasChanged = true;
                }
            }
        }
        for (const field in template) {
            if (!(field in after)) {
                if (field in before) {
                    after[field] = before[field];
                } else {
                    throw 'invalid';
                }
            }
        }
        return hasChanged;
    };

    try {
        if (validateField(input, existing, BlankProvider, changes)) {
            return changes as any;
        }
    } catch (err) {
        if (err === 'invalid') {
            throw new Error('Invalid provider record');
        }
        throw err;
    }

    return null;
}
