import { fsa } from '@chunkd/fs';

/** Search for the imagery across all of our buckets */
export async function findImagery(path: string): Promise<{ files: string[]; totalSize: number }> {
  const files: string[] = [];
  let totalSize = 0;
  for await (const key of fsa.details(path)) {
    const searchKey = key.path.toLowerCase();
    if (searchKey.endsWith('.tif') || searchKey.endsWith('.tiff')) {
      files.push(key.path);
      if (key.size != null) totalSize += key.size;
    }
  }
  return { files, totalSize };
}
