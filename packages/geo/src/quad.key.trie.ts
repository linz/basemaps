/** Symbol for if the value exists */
const QkIndexKey = Symbol('QkExists');

function* iterate(node: QuadKeyTrieNode, currentStr = ''): Generator<string, null, void> {
    if (node[QkIndexKey]) {
        yield currentStr;
        return null;
    }
    for (let key = 0; key < 4; ++key) {
        const newCurrent = node[key];
        if (newCurrent != null) yield* iterate(newCurrent, currentStr + key);
    }
    return null;
}

function removeChildren(trie: QuadKeyTrie, parent: QuadKeyTrieNode): void {
    for (let key = 0; key < 4; ++key) {
        const newCurrent = parent[key];
        if (newCurrent != null) {
            if (newCurrent[QkIndexKey]) --trie.size;
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
        for (let key = 0; key < 4; ++key) {
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

/**
 * Add a child node to parent at idx
 */
function addChild(node: QuadKeyTrieNode, idx: number): QuadKeyTrieNode | null {
    const child = node[idx];
    if (child == null) {
        return (node[idx] = {});
    }
    return child[QkIndexKey] ? null : child;
}

/**
 * Add and trace path to ancesstors of a row of tiles
 */
function addAncestors(
    node: QuadKeyTrieNode | null,
    fromX: number,
    toX = fromX,
    y: number,
    z: number,
): [number, QuadKeyTrieNode | null][] | null {
    let level = 1 << z; // width in pixels of world at zoom level

    // ensure arguments are within boundry (0 to level -1)
    if (fromX < 0) fromX = 0;
    if (fromX >= level) fromX = level - 1;
    if (toX < 0) toX = 0;
    if (toX >= level) toX = level - 1;
    if (y < 0) y = 0;
    if (y >= level) y = level - 1;

    let hl = 0; // half level
    let mask = 0;
    let idx = 0; // quadrant index

    // trace path of parents [visitedIndex, parent]
    const stack: [number, QuadKeyTrieNode | null][] = [];

    // find fromX node creating parents
    let common = true;
    while (true) {
        hl = level >> 1;

        const left = fromX < hl; // left or right quadrant?

        // calc quadrant index
        idx = y < hl ? 3 : 1;
        if (left) idx = idx & 2;

        const child = node && addChild(node, idx);
        if (child == null) {
            if (common && left === toX < hl) {
                return null; // already completely filled
            }
        }

        if (hl == 1) break; // at depth of z

        if (left !== toX < hl) common = false; // fromX and toX have diverged

        stack.push([idx, node]); // push path to parent

        // next level down
        node = child; // might be null if already populated
        mask = hl - 1;
        level = hl;
        y &= mask;
        fromX &= mask;
        toX &= mask;
    }

    stack.push([idx, node]);
    return stack;
}

function mergeFull(
    trie: QuadKeyTrie,
    node: QuadKeyTrieNode,
    stack: [number, QuadKeyTrieNode | null][],
    minSize: number,
): boolean {
    const slen = stack.length;
    let full = false;
    outer: for (let si = slen - 1; si >= 0; --si) {
        if (si + 1 < minSize) break;
        for (let key = 0; key < 4; ++key) {
            if (node[key] == null || node[key]![QkIndexKey] == null) break outer;
        }
        full = true;

        removeChildren(trie, node);
        node = stack[si][1]!;
        const cidx = stack[si][0];
        node[cidx] = { [QkIndexKey]: true };
        if (si + 1 < slen) stack[si + 1][1] = null;
        trie.size++;
    }
    return full;
}

function nextNode(stack: [number, QuadKeyTrieNode | null][]): QuadKeyTrieNode | null {
    /** Next Node on the right **/
    // Search up through parents updating path
    const slen = stack.length;
    let si = slen - 1;
    for (; si >= 0; --si) {
        const row = stack[si];
        if ((row[0] & 1) == 0) {
            row[0] |= 1; // set idx to right
            break; // we haven't process this one yet
        } else {
            // already processed; row[1] node is no longer needed
            row[0] &= 2; // reset idx to left
        }
    }

    if (si < 0) return null;

    // Add ancestors of child
    let node = stack[si][1];
    for (; si < slen; ++si) {
        const row = stack[si];
        const idx = row[0];
        const child = node && addChild(node, idx);
        if (si < slen) {
            row[0] = idx;
            row[1] = node;
        }
        node = child;
    }
    return node;
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
        this.clear();
    }

    /**
     * Build a QuadKeyTrie from a list of quadKeys
     */
    static fromList(quadKeys: string[]): QuadKeyTrie {
        const trie = new QuadKeyTrie();

        for (const s of quadKeys) trie.add(s);

        return trie;
    }

    clear(): void {
        this.size = 0;
        this.trie = {};
    }

    /**
     * Add a quad key to the index
     * @param quadKey Quadkey to add
     */
    add(quadKey: string): void {
        let current: QuadKeyTrieNode | null = this.trie;
        if (current[QkIndexKey]) return;
        for (let i = 0; i < quadKey.length; i++) {
            const char = quadKey[i];
            current = addChild(current, parseInt(char));
            if (current == null) return;
        }

        // Already exists ignore
        if (current[QkIndexKey]) return;

        this.size++;
        current[QkIndexKey] = true;

        removeChildren(this, current);
    }

    /**
     * Fill a row of the trie

     * @param fromX the X coord of the tile to start filling from (inclusive)
     * @param toX the X coord of the tile to end filling on (inclusive)
     * @param y the Y coord of the row to fill
     * @param z the depth (zoom level) to fill at
     * @param minSize merge any filled quadrants but only if result length <= `minSize`
     */
    fillRow(fromX: number, toX = fromX, y: number, z: number, minSize = -1): void {
        if (fromX > toX || z < 1) return; // nothing to fill

        const stack = addAncestors(this.trie, fromX, toX, y, z);
        if (stack == null) return;

        let [idx, node] = stack.pop()!;
        const row = idx & 2; // lower or upper row in quadrant

        let diff = toX - fromX; // how many tiles to add

        // Traverse and fill nodes
        while (diff >= 0) {
            // Fill 1 or 2 nodes
            for (let i = (idx & 1) == 1 || diff == 0 ? 0 : 1; i >= 0; --i, ++idx) {
                --diff;
                if (node != null) {
                    const existing = node[idx];
                    if (existing == null) {
                        this.size++;
                        node[idx] = { [QkIndexKey]: true };
                    } else if (!existing[QkIndexKey]) {
                        this.size++;
                        existing[QkIndexKey] = true;
                        removeChildren(this, existing);
                    }
                }
            }

            // Can we merge a full quadrant?
            if (node != null && minSize != -1 && minSize < z && mergeFull(this, node, stack, minSize)) {
                node = null; // node no longer exists;
            }
            if (diff < 0) return;

            node = nextNode(stack);
            idx = row;
        }
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
    mergeQuadKeys(coveringPercentage: number, minZ: number, maxZ = minZ): number {
        return mergeQuadKeys(this, this.trie, coveringPercentage, minZ, maxZ);
    }

    /**
     * Iterate over all quad keys
     */
    [Symbol.iterator](): Generator<string, null, void> {
        return iterate(this.trie, '');
    }
}
