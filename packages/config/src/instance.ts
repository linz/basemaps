export interface BasemapsConfigObject<T> {
    /** Create a prefixed id for a object */
    id(name: string): string;
    /** Is this object one of these objects */
    is(obj: unknown): obj is T;
    /** Fetch a single object from the store */
    get(id: string): Promise<T | null>;
    /** Fetch all objects from the store */
    getAll(id: Set<string>): Promise<Map<string, T>>;
}
