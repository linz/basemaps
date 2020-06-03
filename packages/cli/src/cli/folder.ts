import { Env, FileOperator } from '@basemaps/shared';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CogJob } from '../cog/types';

/** Make a temp folder inside TEMP_FOLDER's path */
export async function makeTempFolder(folder: string): Promise<string> {
    const tempPath = Env.get(Env.TempFolder, '/tmp');
    const folderPath = path.join(tempPath, folder);

    await fs.mkdir(folderPath, { recursive: true });
    return folderPath;
}

/**
 * Get a nicely formatted folder path based on the job
 *
 * @param job job to get path for
 * @param key optional file key inside of the job folder
 */
export function getJobPath(job: CogJob, key?: string): string {
    if (key != null) {
        return FileOperator.join(job.output.path, [job.projection, job.name, job.id, key].join('/'));
    }
    return FileOperator.join(job.output.path, [job.projection, job.name, job.id].join('/'));
}
