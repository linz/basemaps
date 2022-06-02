import { CompositeError } from '../../composite.error.js';
import { fsa } from '../index.js';

export interface MockFs {
  /**
   * Storage for `FileOperator.readJson` and `writeJson`. If an Error is used as a value then
   * `readJson` will throw the error.
   */
  jsStore: Record<string, any>;
  /**
   * Storage for `FileOperator.read` and `write`. If an Error is used as a value then
   * `read` will throw the error.
   */
  rawStore: Record<string, Buffer | Error>;
  /** Use in `o.beforeEach(mockFs.setup)` */
  setup(): void;
  /** Use in `o.afterEach(mockFs.teardown)` */
  teardown(): void;
}

/**
 * Create an interface for stubbing `FileOperator.read,write,readJson,writeJson`
 */
export function mockFileOperator(): MockFs {
  const origWrite = fsa.write;
  const origRead = fsa.read;
  const origReadJson = fsa.readJson;
  const origWriteJson = fsa.writeJson;

  let jsStore: Record<string, any> = {};
  const mockReadJson = async (path: string): Promise<any> => {
    const ans = jsStore[path] ?? new CompositeError('Not Found', 404, new Error('Mock'));
    if (ans instanceof Error) throw ans;
    return ans;
  };
  const mockWriteJson = async (path: string, json: any): Promise<void> => {
    jsStore[path] = json;
  };

  let rawStore: Record<string, Buffer | Error> = {};
  const mockRead = async (path: string): Promise<Buffer> => {
    const ans = rawStore[path] ?? new CompositeError('Not Found', 404, new Error('Mock'));
    if (ans instanceof Error) throw ans;
    return ans;
  };
  const mockWrite = async (path: string, buffer: Buffer): Promise<void> => {
    rawStore[path] = buffer;
  };

  return {
    get jsStore(): Record<string, any> {
      return jsStore;
    },
    get rawStore(): Record<string, Buffer | Error> {
      return rawStore;
    },
    setup(): void {
      fsa.read = mockRead;
      fsa.write = mockWrite;
      fsa.readJson = mockReadJson;
      fsa.writeJson = mockWriteJson;
      jsStore = {};
      rawStore = {};
    },
    teardown(): void {
      fsa.read = origRead;
      fsa.write = origWrite;
      fsa.readJson = origReadJson;
      fsa.writeJson = origWriteJson;
    },
  };
}
