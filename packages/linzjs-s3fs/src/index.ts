import { FileSystemAbstraction } from './file.al';

export { CompositeError } from './composite.error';
export { FileInfo, FileSystem } from './file';
export { FsS3 } from './file.s3';

export const fsa = new FileSystemAbstraction();
