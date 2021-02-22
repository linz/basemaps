export function toAlbHeaders<T>(mapInstance: Map<string, T>): Record<string, T> | undefined {
    if (mapInstance.size === 0) return undefined;

    const obj: Record<string, T> = {};
    for (const prop of mapInstance) {
        obj[prop[0]] = prop[1];
    }
    return obj;
}

export function toCloudFrontHeaders<T>(mapInstance: Map<string, T>): Record<string, { key: string; value: string }[]> {
    if (mapInstance.size === 0) return {};

    const obj: Record<string, { key: string; value: string }[]> = {};
    for (const prop of mapInstance) {
        obj[prop[0]] = [{ key: prop[0], value: String(prop[1]) }];
    }
    return obj;
}
