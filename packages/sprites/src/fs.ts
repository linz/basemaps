import { readdir, readFile } from 'node:fs/promises';
import path, { join, parse } from 'node:path';
import { SvgId } from './sprites.js';

const ValidExtensions = new Set(['.svg']);

export async function listSprites(spritePath: string, validExtensions = ValidExtensions): Promise<SvgId[]> {
  const files = await readdir(spritePath);
  const sprites = files.filter((f) => validExtensions.has(path.extname(f.toLowerCase())));
  if (sprites.length === 0) throw new Error('No .svg files found: ' + spritePath);

  return await Promise.all(
    sprites.map(async (c) => {
      return {
        id: parse(c).name, // remove the .svg
        svg: await readFile(join(spritePath, c)),
      };
    }),
  );
}
