export abstract class ObjectCache<T, K> {
    map: Map<string, T> = new Map();

    getOrMake(key: string, args: K): T {
        let existing = this.map.get(key);
        if (existing == null) {
            existing = this.create(args);
            this.map.set(key, existing);
        }
        return existing;
    }

    abstract create(args: K): T;
}
