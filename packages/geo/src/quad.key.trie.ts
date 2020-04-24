import { QuadKey } from './quad.key';

/** Symbol for if the value exists */
const QkIndexKey = Symbol('QkExists');
const QkParent = Symbol('QkParent');

interface QuadKeyTrieNode {
    [key: string]: QuadKeyTrieNode;
    [QkIndexKey]?: boolean;
    [QkParent]: QuadKeyTrieNode | null;
}

function trieToList(current: QuadKeyTrieNode, currentStr: string, output: string[]): string[] {
    if (current[QkIndexKey]) {
        output.push(currentStr);
        // TODO by returning here we are removing any children keys that may exist
        // They are not really useful as they are fully enclosed by this current key
        return output;
    }
    for (const key of QuadKey.Keys) {
        const newCurrent = current[key];
        if (newCurrent) trieToList(newCurrent, currentStr + key, output);
    }
    return output;
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
        return trieToList(this.trie, '', []);
    }
}
