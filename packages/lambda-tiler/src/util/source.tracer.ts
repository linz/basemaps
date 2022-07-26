import { sha256base58 } from '@basemaps/config';
import { ChunkSource } from '@chunkd/core';

interface SourceRequest {
  id?: string;
  offset: number;
  length?: number;
  source: string;
  duration?: number;
}

export class SourceTracer {
  requests: SourceRequest[] = [];

  /** Reset the request tracer */
  reset(): void {
    this.requests = [];
  }

  /** Override the fetchByte function to trace all requests for this source  */
  trace(source: ChunkSource): void {
    const originFetch = source.fetchBytes;
    source.fetchBytes = async (offset: number, length?: number): Promise<ArrayBuffer> => {
      const request: SourceRequest = { source: source.uri, offset, length };
      const traceId = sha256base58(`${request.source}:${request.offset}:${request.length}`);
      request.id = traceId;
      this.requests.push(request);
      const startTime = Date.now();

      const ret = await originFetch.apply(source, [offset, length]);

      request.duration = Date.now() - startTime;
      return ret;
    };
  }
}

export const St = new SourceTracer();
