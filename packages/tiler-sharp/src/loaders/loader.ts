import Sharp from 'sharp';

export interface Loader {
  name: string;
  load(ctx: LoaderContext): Promise<Sharp.Sharp>;
}

export interface LoaderContext {
  /** Raw bytes to load from */
  buffer: ArrayBuffer;
  /** any no data values */
  noData?: number | null;
}
