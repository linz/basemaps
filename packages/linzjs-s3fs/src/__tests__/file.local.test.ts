import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const __filename = url.fileURLToPath(import.meta.url);
import o from 'ospec';
import { FsLocal } from '../abstractions/file.local.js';
import { CompositeError } from '../composite.error.js';
import { FileSystemAbstraction } from '../file.al.js';
import * as path from 'path';
import { promises as fs } from 'fs';

o.spec('FileLocal', () => {
    const RootFolder = process.platform === 'darwin' ? '/var/root' : '/root';
    const s3fs = new FileSystemAbstraction();
    const localFs = new FsLocal();

    o('Should head objects', async () => {
        const res = await localFs.head(__filename);
        o(res).notEquals(null);
        o((res?.size || 0) > 3000).equals(true);
    });

    o('should list with details', async () => {
        const res = await s3fs.toArray(localFs.listDetails(__dirname));
        o(res.length > 1).equals(true);
        const file = res.find((f) => f.path === __filename);
        o(file).notEquals(undefined);
        o((file?.size || 0) > 3000).equals(true);
        o(file?.path).equals(__filename);
    });

    o('should list recursively', async () => {
        const res = await s3fs.toArray(localFs.listDetails(__dirname));
        const resUp = await s3fs.toArray(localFs.listDetails(path.join(__dirname, '..')));
        o(resUp.length > res.length).equals(true);
        // Should find all files in the parent list
        for (const file of res) o(resUp.find((f) => f.path === file.path)).notEquals(undefined);

        // Should not emit directories
        for (const file of resUp) {
            o((await fs.stat(file.path)).isDirectory()).equals(false);
        }
    });

    o('Should capture not found errors:list', async () => {
        try {
            await s3fs.toArray(localFs.list('/foo/bar/baz'));
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(404);
        }
    });

    o('Should capture not found errors:write', async () => {
        try {
            await localFs.write('/foo/bar/baz', Buffer.from('foobar'), false);
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(404);
        }
    });

    o('Should capture not found errors:read', async () => {
        try {
            await localFs.read('/foo/bar/baz');
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(404);
        }
    });

    o('Should capture permission errors:list', async () => {
        if (process.platform === 'darwin') return;
        try {
            await s3fs.toArray(localFs.list(path.join(RootFolder, 'test')));
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });

    o('Should capture permission errors:write', async () => {
        try {
            await localFs.write(path.join(RootFolder, 'test'), Buffer.from('foobar'), false);
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });

    o('Should capture permission errors:read', async () => {
        if (process.platform === 'darwin') return;
        try {
            await localFs.read(path.join(RootFolder, 'test'));
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });
});
