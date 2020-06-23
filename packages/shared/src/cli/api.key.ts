#!/usr/bin/env node

import { Aws } from '../aws';

import baseX from 'base-x';
import { randomBytes } from 'crypto';

const base58 = baseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

/** Generate 10 32 character base58 encoded strings */
async function main(): Promise<void> {
    for (let i = 0; i < 10; i++) {
        const bytes = randomBytes(32);
        const apiKey = base58.encode(bytes).slice(0, 32);

        console.log(apiKey);
        await Aws.apiKey.create(apiKey);
    }
}

main();
