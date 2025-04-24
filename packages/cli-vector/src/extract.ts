import { fsa } from '@basemaps/shared';
import path from 'path';
// import { createGunzip } from 'zlib';

// import { Layer } from '../layer/layer.js';

export const LDS_CACHE_BUCKET = 's3://linz-lds-cache/';
const format = 'gpkg';

export interface LdsLayer {
  /** Path of file eg `s3://linz-lds-cache/50306/foo.gpkg` or `./.cache/50306/foo.gpkg` */
  filePath: URL;
  /** Layer Id */
  layerId: string;
  /** LDS Version Id */
  version: number;
}

export interface LdsLayerFile extends LdsLayer {
  /** Number of features */
  featureCount?: number;
  /** If a human friendly name is known */
  name?: string;
  /** List of vector tile layers this layer was used in */
  targetLayers: string[];
}

export class Extract {
  _files?: Promise<Map<string, LdsLayerFile>>;

  /**
   * List all the files in the LDS Cache and return a map of the latest versions
   */
  getLdsCacheFiles(): Promise<Map<string, LdsLayerFile>> {
    if (this._files == null)
      this._files = fsa.toArray(fsa.list(new URL(LDS_CACHE_BUCKET))).then((f) => Extract.prepareFiles(f));
    return this._files;
  }

  /**
   * Get all the latest files and only keep the latest version of geopackage
   */
  static prepareFiles(files: URL[]): Map<string, LdsLayerFile> {
    const allFiles = new Map<string, LdsLayerFile>();

    for (const filePath of files) {
      if (!filePath.href.endsWith(format)) continue;
      const file = Extract.parseFile(filePath);
      const cachedFile = allFiles.get(file.layerId);
      if (cachedFile == null || cachedFile.version < file.version) {
        allFiles.set(file.layerId, file);
      }
    }

    return allFiles;
  }

  /**
   * parse the file from path
   * s3://linz-lds-cache/50063/50063_304191.gpkg
   *
   * @returns {LdsLayerFile}
   */
  static parseFile(filePath: URL): LdsLayerFile {
    const filename = path.parse(filePath.href).base;
    const name = filename.split('.')[0];
    const [layerId, version] = name.split('_');
    return { filePath, layerId, version: Number(version), targetLayers: [] };
  }
}

export const lds = new Extract();
