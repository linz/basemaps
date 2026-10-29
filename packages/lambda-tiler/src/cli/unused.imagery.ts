import { type ConfigBundled } from '@basemaps/config';
import type { FileInfo } from '@chunkd/fs';

/** Prefixes that contain imagery and elevation imports, vector data is intentionally not included */
export const ImageryPrefixes = ['2193/', '3857/', 'elevation/'];

export interface UnusedImagery {
  /** Location of the import eg `s3://linz-basemaps/3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/` */
  location: string;
  /** Number of files */
  files: number;
  /** Total size in bytes */
  size: number;
  /** Most recent modification of any file in the import */
  lastModified: string;
}

/**
 * Find every location inside of `bucket` that is referenced by a config
 *
 * The full config is searched rather than specific fields so any reference to the bucket is found,
 * file references are converted into their parent folder
 *
 * @param config Config JSON to search
 * @param bucket Bucket to look for eg `s3://linz-basemaps/`
 */
export function getReferencedLocations(config: ConfigBundled, bucket: URL, output = new Set<string>()): Set<string> {
  for (const img of config.imagery) {
    if (!img.uri.startsWith(bucket.href)) continue;
    output.add(img.uri.endsWith('/') ? img.uri : `${img.uri}/`);
  }
  return output;
}

/** Is the location or any of its parents referenced */
function isReferenced(location: string, referenced: Set<string>): boolean {
  let end = location.indexOf('/', 'xx://'.length);
  while (end > -1) {
    if (referenced.has(location.slice(0, end + 1))) return true;
    end = location.indexOf('/', end + 1);
  }
  return false;
}

/**
 * Group files into their folders and find the folders that are not referenced
 *
 * @param files All the files to consider
 * @param referenced Locations that are referenced by configs, from {@link getReferencedLocations}
 */
export function findUnusedImagery(files: Iterable<FileInfo>, referenced: Set<string>): UnusedImagery[] {
  const folders = new Map<string, UnusedImagery>();

  for (const file of files) {
    const href = file.url.href;
    const location = href.slice(0, href.lastIndexOf('/') + 1);

    let folder = folders.get(location);
    if (folder == null) {
      folder = { location, files: 0, size: 0, lastModified: '' };
      folders.set(location, folder);
    }
    folder.files++;
    folder.size += file.size ?? 0;
    if (file.lastModified && file.lastModified > folder.lastModified) folder.lastModified = file.lastModified;
  }

  return [...folders.values()].filter((f) => !isReferenced(f.location, referenced)).sort((a, b) => b.size - a.size);
}
