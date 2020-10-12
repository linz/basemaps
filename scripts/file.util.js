const { join } = require('path');
const fs = require('fs').promises;

/**
 * call `callback` for every file in `topDir`. Sub directories a traversed unless callback returns false.

 * @param topDir top directory to scan
 * @param callback async function that is called with (subPath, isDir) and returns true if dir
 * should be traversed.
 */
exports.recurseDirectory = async (topDir, callback) => {
    const recurse = async (subDir) => {
        const path = subDir === '' ? topDir : join(topDir, subDir);
        const files = await fs.readdir(path);
        for (const file of files) {
            const subPath = subDir === '' ? file : join(subDir, file);
            const stat = await fs.stat(join(topDir, subPath));
            if (stat.isDirectory()) {
                if (await callback(subPath, true)) {
                    await recurse(subPath);
                }
            } else {
                await callback(subPath, false);
            }
        }
    };

    await recurse('');
};
