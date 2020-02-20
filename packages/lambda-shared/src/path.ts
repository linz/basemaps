import { pathToRegexp } from 'path-to-regexp';

const XyzPath = pathToRegexp('/v1/:group/:z/:x/:y\\.:ext');

export interface PathData {
    group: string;
    x: number;
    y: number;
    z: number;
    ext: string;
}
export function getXyzFromPath(path: string): null | PathData {
    const output = XyzPath.exec(path);
    if (output == null) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, group, z, x, y, ext] = output;
    return { group, x: parseInt(x, 10), y: parseInt(y, 10), z: parseInt(z, 10), ext };
}
