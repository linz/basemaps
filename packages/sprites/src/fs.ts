import { promises as fs } from 'node:fs';
import path, { join, parse } from 'node:path';

import { SvgId } from './sprites.js';

export const ValidExtensions = new Set(['.svg']);

export async function listSprites(spritePath: string, validExtensions = ValidExtensions): Promise<SvgId[]> {
  const files = await fs.readdir(spritePath);
  const sprites = files.filter((f) => validExtensions.has(path.extname(f.toLowerCase())));
  if (sprites.length === 0) {
    throw new Error('No files found: ' + spritePath + ' with extension: ' + [...ValidExtensions].join(','));
  }

  return await Promise.all(
    sprites.map(async (c) => {
      return {
        id: parse(c).name, // remove the extension .svg
        buffer: await fs.readFile(join(spritePath, c)),
      };
    }),
  );
}
