import { execFileSync } from 'child_process';

export function GitTag(): { version: string; hash: string } {
    return {
        version: execFileSync('git', ['describe', '--tags', '--always', '--match', 'v*']).toString().trim(),
        hash: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
    };
}
