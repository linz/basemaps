import { QuadKey } from './quad.key';

/** Symbol for if the value exists */
const QkIndexKey = Symbol('QkExists');
const QkParent = Symbol('QkParent');

function* iterate(
    node: QuadKeyTrieNode,
    currentStr = '',
    full = false,
): Generator<[string, QuadKeyTrieNode], null, void> {
    if (node[QkIndexKey]) {
        yield [currentStr, node];
        if (!full) return null;
    }
    for (const key of QuadKey.Keys) {
        const newCurrent = node[key];
        if (newCurrent != null) yield* iterate(newCurrent, currentStr + key, full);
    }
    return null;
}

function collectForPoint(quadKeys: string[], point: number[], node: QuadKeyTrieNode, currentStr = ''): void {
    if (QuadKey.containsPoint(currentStr, point)) {
        if (node[QkIndexKey]) quadKeys.push(currentStr);
        for (const key of QuadKey.Keys) {
            const newCurrent = node[key];
            if (newCurrent != null) collectForPoint(quadKeys, point, newCurrent, currentStr + key);
        }
    }
}

export interface QuadKeyTrieNode {
    [key: string]: QuadKeyTrieNode;
    [QkIndexKey]?: boolean;
    [QkParent]: QuadKeyTrieNode | null;
}

export class QuadKeyTrie {
    /**
     * Get the parent Trie node for a quadkey
     * @param node Parent node, Self if node is the root
     */
    static parent(node: QuadKeyTrieNode): QuadKeyTrieNode | null {
        return node[QkParent];
    }

    /**
     * Has this node have this exact child key
     * @param node Trie node to check
     * @param key QuadKey to check
     *
     * @example
     * ```
     * QuadKeyTrie.has(node, '3')
     * ```
     */
    static has(node: QuadKeyTrieNode, key: string): boolean {
        const childNode = node[key];
        if (childNode && childNode[QkIndexKey]) return true;
        return false;
    }

    /** Number of elements in the Trie */
    size: number;
    trie: QuadKeyTrieNode;

    constructor() {
        this.size = 0;
        this.trie = { [QkParent]: null };
    }

    /**
     * Build a QuadKeyTrie from a list of quadKeys
     */
    static fromList(quadKeys: string[]): QuadKeyTrie {
        const trie = new QuadKeyTrie();

        for (const s of quadKeys) trie.add(s);

        return trie;
    }

    /**
     * Add a quad key to the index
     * @param qk Quadkey to add
     * @returns Trie node that was added
     */
    add(qk: string): QuadKeyTrieNode {
        let current = this.trie;
        for (let i = 0; i < qk.length; i++) {
            const char = qk[i];
            let existing = current[char];
            if (existing == null) {
                current[char] = existing = { [QkParent]: current };
            }
            current = existing;
        }

        // Already exists ignore
        if (current[QkIndexKey]) return current;

        this.size++;
        current[QkIndexKey] = true;
        return current;
    }

    get(qk: string): QuadKeyTrieNode | null {
        let current = this.trie;
        for (let i = 0; i < qk.length; i++) {
            const char = qk[i];
            current = current[char];
            if (current == null) return null;
        }
        return current;
    }

    /**
     * Get all Quadkeys for the given point
     */
    getPoint(point: number[]): string[] {
        const quadKeys: string[] = [];
        collectForPoint(quadKeys, point, this.trie, '');
        return quadKeys;
    }

    /**
     * Does this exact quadkey exist in the Trie
     * @param qk Quadkey to check
     */
    has(qk: string): boolean {
        const node = this.get(qk);
        if (node == null) return false;
        return node[QkIndexKey] != null;
    }

    /**
     * Does this quadkey have any intersections with the index
     *
     * @param qk
     */
    intersects(qk: string): boolean {
        let current = this.trie;
        if (current[QkIndexKey]) return true;

        for (let i = 0; i < qk.length; i++) {
            const char = qk[i];
            current = current[char];
            if (current == null) return false;
            if (current[QkIndexKey]) return true;
        }
        return current != null;
    }

    /**
     * Convert the trie to a list of QuadKeys
     */
    toList(): string[] {
        return Array.from(this);
    }

    *[Symbol.iterator](): Generator<string, null, void> {
        for (const [str] of iterate(this.trie, '')) yield str;
        return null;
    }

    *nodes(from = this.trie, full = true): Generator<[string, QuadKeyTrieNode], null, void> {
        return yield* iterate(from, '', full);
    }
}
