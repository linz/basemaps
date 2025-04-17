import { Env } from '@basemaps/shared';
import { promises as fs } from 'fs';
import * as path from 'path';

/** Make a temp folder inside TEMP_FOLDER's path */
export async function makeTempFolder(folder: string): Promise<string> {
  const tempPath = Env.get(Env.TempFolder) ?? '/tmp';
  const folderPath = path.join(tempPath, folder);

  await fs.mkdir(folderPath, { recursive: true });
  return folderPath;
}

/** Make a tiff folder inside TEMP_FOLDER's path */
export async function makeTiffFolder(tmpFolder: string, name: string): Promise<string> {
  const folderPath = path.join(tmpFolder, name);

  await fs.mkdir(folderPath, { recursive: true });
  return folderPath;
}
