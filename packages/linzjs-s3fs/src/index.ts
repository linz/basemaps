import { FileSystemAbstraction } from './file.al.js';

export { CompositeError } from './composite.error.js';
export { FileInfo, FileSystem } from './file.js';
export { FsS3 } from './abstractions/file.s3.js';

export const fsa = new FileSystemAbstraction();
