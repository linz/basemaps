import { QuadKey } from './quad.key';

/** Symbol for if the value exists */
const QkIndexKey = Symbol('QkExists');

function* iterate(node: QuadKeyTrieNode, currentStr = ''): Generator<string, null, void> {
    if (node[QkIndexKey]) {
        yield currentStr;
        return null;
    }
    for (const key of QuadKey.Keys) {
        const newCurrent = node[key];
        if (newCurrent != null) yield* iterate(newCurrent, currentStr + key);
    }
    return null;
}

function removeChildren(trie: QuadKeyTrie, parent: QuadKeyTrieNode): void {
    for (const key of QuadKey.Keys) {
        const newCurrent = parent[key];
        if (newCurrent != null) {
            --trie.size;
            parent[key] = null;
            removeChildren(trie, newCurrent);
        }
    }
}

/**
 * Merge all child nodes into current visited node
 */
function mergeChildren(trie: QuadKeyTrie, parent: QuadKeyTrieNode): void {
    if (!parent[QkIndexKey]) {
        ++trie.size;
        parent[QkIndexKey] = true;
    }
    removeChildren(trie, parent);
}

// recursive function called from QuadKeyTrie.mergeQuadKeys
function mergeQuadKeys(
    trie: QuadKeyTrie,
    parent: QuadKeyTrieNode,
    coveringPercentage: number,
    minZ: number,
    maxZ: number,
    level = 0,
): number {
    let coverCount = 0;
    if (parent[QkIndexKey]) {
        coverCount += 1.0;
    } else {
        let childCount = 0;
        for (const key of QuadKey.Keys) {
            const child = parent[key];
            if (child != null) {
                ++childCount;
                coverCount += mergeQuadKeys(trie, child, coveringPercentage, minZ, maxZ, level + 1) * 0.25;
            }
        }

        if (
            // node not too big and populated enough
            (level >= minZ && coverCount >= coveringPercentage) ||
            // node too small and would reduce node count
            (level >= maxZ && childCount > 1)
        ) {
            mergeChildren(trie, parent);
        }
    }
    return coverCount;
}

interface QuadKeyTrieNode {
    [key: string]: QuadKeyTrieNode | null;
    [QkIndexKey]?: boolean;
}

export class QuadKeyTrie {
    /** Number of elements in the Trie */
    size: number;
    private trie: QuadKeyTrieNode;

    /**
     * An Iterate-able Trie of quad keys
     */
    constructor() {
        this.size = 0;
        this.trie = {};
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
     * @param quadKey Quadkey to add
     */
    add(quadKey: string): void {
        let current = this.trie;
        for (let i = 0; i < quadKey.length; i++) {
            const char = quadKey[i];
            let existing = current[char];
            if (existing == null) {
                current[char] = existing = {};
            }
            current = existing;
        }

        // Already exists ignore
        if (current[QkIndexKey]) return;

        this.size++;
        current[QkIndexKey] = true;

        removeChildren(this, current);
    }

    /**
     * Does this exact quadkey exist in the Trie
     * @param quadKey Quadkey to check
     */
    has(quadKey: string): boolean {
        let current: QuadKeyTrieNode | null = this.trie;
        for (let i = 0; i < quadKey.length; i++) {
            const char = quadKey[i];
            current = current[char];
            if (current == null) return false;
        }
        return current[QkIndexKey] != null;
    }

    /**
     * Iterate over all quad keys that intersect with `quadKey`
     *
     * @param quadKey
     */
    *intersectingQuadKeys(quadKey: string): Generator<string, null, void> {
        let current: QuadKeyTrieNode | null = this.trie;
        if (current[QkIndexKey]) {
            yield '';
            return null;
        }

        let result = '';

        for (let i = 0; i < quadKey.length; i++) {
            const char = quadKey[i];
            current = current[char];
            if (current == null) return null;

            result += char;
            if (current[QkIndexKey]) {
                yield result;
                return null;
            }
        }

        yield* iterate(current, result);
        return null;
    }

    /**
     * Does this quadkey have any intersections with the index
     *
     * @param quadKey
     */
    intersectsKey(quadKey: string): boolean {
        let current: QuadKeyTrieNode | null = this.trie;
        if (current[QkIndexKey]) return true;

        for (let i = 0; i < quadKey.length; i++) {
            const char = quadKey[i];
            current = current[char];
            if (current == null) return false;
            if (current[QkIndexKey]) return true;
        }
        return current != null;
    }

    /**
     * Do the two Tries intersect
     */
    intersectsTrie(other: QuadKeyTrie): boolean {
        for (const qk of this) {
            if (other.intersectsKey(qk)) return true;
        }
        return false;
    }

    /**
     * Make a new QuadKeyTrie which the intersection of this QuadKeyTrie and `other`

     * @param other
     * @return the new intersection QuadKeyTrie
     */
    intersection(other: QuadKeyTrie): QuadKeyTrie {
        const result = new QuadKeyTrie();
        for (const qkA of this) {
            for (const qkB of other.intersectingQuadKeys(qkA)) {
                result.add(qkA.length > qkB.length ? qkA : qkB);
            }
        }

        return result;
    }

    /**
     * Merge child nodes that have at least coveringPercentage within a zoom range of `minZ` to
     * `maxz`.

     * @param minZ Don't merge any quadKeys of this length or less
     * @param maxZ Merge any quadKeys of at least this length if they are an only child
     * @return the percentage covered of the world by this covering set
     */
    mergeQuadKeys(coveringPercentage: number, minZ: number, maxZ: number): number {
        return mergeQuadKeys(this, this.trie, coveringPercentage, minZ, maxZ);
    }

    /**
     * Iterate over all quad keys
     */
    [Symbol.iterator](): Generator<string, null, void> {
        return iterate(this.trie, '');
    }
}
