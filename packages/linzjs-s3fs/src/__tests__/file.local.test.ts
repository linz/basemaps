import o from 'ospec';
import { FsLocal } from '../file.local';
import { CompositeError } from '../composite.error';
import { S3Fs } from '..';

o.spec('FileLocal', () => {
    const s3fs = new S3Fs();
    const localFs = new FsLocal();
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
        try {
            await s3fs.toArray(localFs.list('/root/test'));
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });

    o('Should capture permission errors:write', async () => {
        try {
            await localFs.write('/root/test', Buffer.from('foobar'), false);
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });

    o('Should capture permission errors:read', async () => {
        try {
            await localFs.read('/root/test');
            throw new Error('Failed to throw');
        } catch (e) {
            o(CompositeError.isCompositeError(e)).equals(true);
            o(e.code).equals(403);
        }
    });
});
