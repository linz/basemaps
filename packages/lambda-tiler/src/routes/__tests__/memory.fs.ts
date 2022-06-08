import { ChunkSource, CompositeError, FileInfo, FileSystem } from '@chunkd/core';
import { Readable } from 'stream';

export async function toBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buf: Buffer[] = [];

    stream.on('data', (chunk) => buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buf)));
    stream.on('error', (err) => reject(`error converting stream - ${err}`));
  });
}
export function toReadable(r: string | Buffer | Readable): Readable {
  if (typeof r === 'string') r = Buffer.from(r);
  return Readable.from(r);
}

// TODO this should be provided by @chunkd/fs as it already provides a memory source
export class FsMemory implements FileSystem {
  protocol = 'memory';

  files: Map<string, Buffer> = new Map();

  async read(filePath: string): Promise<Buffer> {
    const data = this.files.get(filePath);
    if (data == null) throw new CompositeError('Not found', 404, new Error());
    return data;
  }

  stream(filePath: string): Readable {
    const buf = this.files.get(filePath);
    if (buf == null) throw new CompositeError('Not found', 404, new Error());
    return toReadable(buf);
  }

  async write(filePath: string, buffer: string | Buffer | Readable): Promise<void> {
    if (typeof buffer === 'string') {
      this.files.set(filePath, Buffer.from(buffer));
      return;
    }
    if (Buffer.isBuffer(buffer)) {
      this.files.set(filePath, buffer);
      return;
    }
    const buf = await toBuffer(buffer);
    this.files.set(filePath, buf);
  }

  async *list(filePath: string): AsyncGenerator<string> {
    for (const file of this.files.keys()) {
      if (file.startsWith(filePath)) yield file;
    }
  }

  async *details(filePath: string): AsyncGenerator<FileInfo> {
    for await (const file of this.list(filePath)) {
      const data = await this.head(file);
      if (data == null) continue;
      yield data;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const dat = await this.head(filePath);
    return dat != null;
  }

  async head(filePath: string): Promise<FileInfo | null> {
    const buf = this.files.get(filePath);
    if (buf == null) return null;
    return { path: filePath, size: buf.length };
  }

  source(): ChunkSource {
    throw new Error('Method not implemented.');
  }
}
