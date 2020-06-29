import { createHash, Hash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { GitTag } from '@basemaps/shared/build/cli/git.tag';

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

export interface VersionInfo {
    /** Current git tag */
    version: string;
    /** Current commit hash  */
    hash: string;
}

let versionInfo: VersionInfo | null = null;
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

    /**
     * Get version information about the current build
     *
     */
    version(): VersionInfo {
        if (versionInfo == null) {
            versionInfo = GitTag();
        }
        return versionInfo;
    },
};
