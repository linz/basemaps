import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * call `callback` for every file in `topDir`. Sub directories a traversed unless callback returns false.

 * @param topDir top directory to scan
 * @param callback async function that is called with (subPath, isDir) and returns true if dir
 * should be traversed.
 */
export async function recurseDirectory(topDir, callback) {
  const recurse = async (subDir) => {
    const path = subDir === '' ? topDir : join(topDir, subDir);
    const files = await fs.readdir(path);
    await Promise.all(files.map(async (file) => {
      const subPath = subDir === '' ? file : join(subDir, file);
      const stat = await fs.stat(join(topDir, subPath));
      if (stat.isDirectory()) {
        if (await callback(subPath, true)) {
          return recurse(subPath);
        }
      } else {
        return callback(subPath, false);
      }
    }));
  };

  await recurse('');
}
