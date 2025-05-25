import { sha256base58 } from '@basemaps/config';
import { fsa, LogType } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { z } from 'zod';

import { lds, LDS_CACHE_BUCKET } from '../extract.js';
import { zSchema } from './parser.js';
import { Schema } from './schema.js';

const LARGE_LAYER_SIZE = 1024 * 1024 * 1024; // processing for large layers that over 1GB

export class SchemaLoader {
  path: URL;
  logger: LogType;
  schemas: Schema[] = [];
  cache?: URL;
  constructor(path: URL, logger: LogType, cache?: URL) {
    this.path = path;
    this.logger = logger;
    this.cache = cache;
  }

  /**
   * Read the json schema from the path
   *
   */
  private async readJsonSchema(): Promise<Schema[]> {
    this.logger.info({ path: this.path.href }, 'SchemaLoader: ReadJsonSchema');
    const files = await fsa.toArray(fsa.list(this.path));
    for (const file of files) {
      if (file.href.endsWith('.json')) {
        const schema = await fsa.readJson(file);
        // Validate the json
        try {
          const parsed = zSchema.parse(schema);
          this.schemas.push(parsed);
        } catch (e) {
          if (e instanceof z.ZodError) {
            // Thrown error
            throw new Error(`Schema ${file.href} is invalid: ${e.message}`);
          }
        }
      }
    }
    return this.schemas;
  }

  /**
   * Prepare the schema with additional information
   * Add cache path, layer id, and version for lds-cache layer in path
   *
   */
  private async prepareSchema(): Promise<Schema[]> {
    this.logger.info({ path: this.path.href }, 'SchemaLoader: PrepareSchema');
    const files = await lds.getLdsCacheFiles();
    for (const schema of this.schemas) {
      this.logger.info({ layer: schema.name }, 'SchemaLoader: PrepareLayer');
      for (const layer of schema.layers) {
        // Set layer simplify
        if (schema.simplify != null && layer.simplify == null) layer.simplify = schema.simplify;

        // Set layer path to the latest layer in lds-cache
        const isLdsFile = layer.source.startsWith(LDS_CACHE_BUCKET);
        if (isLdsFile) {
          const file = files.get(layer.id);
          if (file == null) throw new Error(`Layer ${layer.id} is not exist in lds cache.`);
          // Set the layer path to the latest layer
          layer.version = file.version;
          layer.source = file.filePath.href;
        }

        // Check existence of the layer path and set file size for larger layers
        const fileInfo = await fsa.head(new URL(layer.source));
        if (fileInfo == null) throw new Error(`Layer ${layer.id} path ${layer.source} does not exist`);
        if (fileInfo.size != null && fileInfo.size > LARGE_LAYER_SIZE) layer.largeLayer = true;

        // Set the cache path for the layer
        const configHash = sha256base58(JSON.stringify({ name: schema.name, layer, version: CliInfo.version }));
        if (this.cache != null) {
          const fileName = isLdsFile
            ? `${layer.id}_${layer.version}_${configHash}.mbtiles`
            : `${layer.id}_${configHash}.mbtiles`;
          const path = new URL(`${layer.id}/${fileName}`, this.cache);
          const exists = await fsa.exists(path);
          const cache = {
            fileName,
            path,
            exists,
          };
          layer.cache = cache;
        }
      }
    }
    return this.schemas;
  }

  async load(): Promise<Schema[]> {
    // Load the schema
    await this.readJsonSchema();
    // Prepare the schema with additional information
    return this.prepareSchema();
  }
}
