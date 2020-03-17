export interface ActionData {
    version: string;
    action: string;
    rest: string[];
    urlPath: string;
}

export interface TileData {
    x: number;
    y: number;
    z: number;
    ext: string;
}

export const extractAction = (info: ActionData): void => {
    const path = info.urlPath;
    const [version, action, ...rest] = (path[0] === '/' ? path.slice(1) : path).split('/');
    if (action == null) {
        info.version = 'v1';
        info.action = version;
        info.rest = [];
    } else {
        info.version = version;
        info.action = action;
        info.rest = rest;
    }
};

export const tileFromPath = (path: string[]): TileData | null => {
    if (path.length != 3) return null;

    const z = parseInt(path[0], 10);
    const x = parseInt(path[1], 10);
    const [ystr, ext] = path[2].split('.', 2);
    const y = parseInt(ystr, 10);

    if (isNaN(x) || isNaN(y) || isNaN(z) || !/^(?:png)$/.test(ext)) return null;

    return { x, y, z, ext };
};
