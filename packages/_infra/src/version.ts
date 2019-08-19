import { createHash, Hash } from 'crypto';
import fs = require('fs');
import path = require('path');

/**
 * Hash a tree of files returning a single hash
 *
 * @param folder Folder to hash
 * @param hash current hash function
 */
function hashTree(folder: string, hash: Hash): void {
    const files = fs.readdirSync(folder);

    for (const file of files) {
        const filleName = path.join(folder, file);
        const stat = fs.statSync(filleName);

        if (stat.isDirectory()) {
            hashTree(filleName, hash);
            continue;
        }

        const source = fs.readFileSync(filleName);
        hash.update(source);
    }
}

export const VersionUtil = {
    /**
     * Generate a hash of all files inside the source directory
     * @param srcPath path to source folder
     */
    hash(srcPath: string): string {
        const hash = createHash('sha256');
        hashTree(srcPath, hash);
        return hash.digest('base64');
    },
};
