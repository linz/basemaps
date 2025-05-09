import { Epsg } from '@basemaps/geo';
import { createReadStream, promises as fs, ReadStream } from 'fs';

export const projection = Epsg.Wgs84.toEpsgString();

/**
 * Asynchronously touch the file by path and return true if file exists
 */
export async function fileExist(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch (ENOENT) {
    return false;
  }
}

export function createReadStreamSafe(filename: string): Promise<ReadStream> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filename);
    fileStream.on('error', reject).on('open', () => {
      resolve(fileStream);
    });
  });
}
