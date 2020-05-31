const EMPTY = 0;
const EXISTS = 1;
const TOP = 2;

/**
 * Link list of freed nodes
 * @param idx pointer to the node to free
 */
function freeSpace(nodes: number[], idx: number): void {
    nodes[idx] = nodes[EMPTY];
    nodes[EMPTY] = idx;
}

/**
 * Recursively remove any children from node and free node
 * @param firstChild must point to the first child (not the parent or any other child)
 */
function removeChildren(nodes: number[], firstChild: number): void {
    for (let key = 0; key < 4; ++key) {
        const newIdx = nodes[firstChild + key];
        if (newIdx !== EMPTY) {
            if (newIdx === EXISTS) {
                --nodes[EXISTS];
            } else {
                removeChildren(nodes, newIdx);
            }
            nodes[firstChild + key] = EMPTY;
        }
    }

    freeSpace(nodes, firstChild);
}

/**
 * Delete a node (or leaf) and all its children
 * @param idx pointer to the node to remove
 */
function delNode(nodes: number[], idx: number): void {
    const childIdx = nodes[idx];
    if (childIdx !== EMPTY) {
        nodes[idx] = EMPTY;
        if (childIdx === EXISTS) {
            nodes[EXISTS]--;
        } else {
            removeChildren(nodes, childIdx);
        }
    }
}

/**
 * Add a child leaf to parent at idx
 * @param idx pointer to where the left is to be added
 */
function addLeaf(nodes: number[], idx: number): void {
    const childIdx = nodes[idx];
    if (childIdx !== EXISTS) {
        nodes[idx] = EXISTS;
        nodes[EXISTS]++;
        if (childIdx !== EMPTY) removeChildren(nodes, childIdx);
    }
}

/**
 * Add a child node to parent at idx
 * @param idx pointer to where the node is to be added
 */
function addNode(nodes: number[], idx = 0): number {
    if (nodes.length == 2) {
        if (nodes[EXISTS] == 1) return EXISTS; // top node is a leaf
        nodes.push(EMPTY, EMPTY, EMPTY, EMPTY); // was empty
        return TOP;
    } else {
        const newIdx = nodes[idx];
        if (newIdx === EXISTS) return EXISTS; // leaf exists
        if (newIdx !== EMPTY) return newIdx; // node exists
    }

    // need to add a node
    const freeIdx = nodes[EMPTY];
    if (freeIdx === EMPTY) {
        // no free space; extend array
        nodes.push(EMPTY, EMPTY, EMPTY, EMPTY);
        return (nodes[idx] = nodes.length - 4);
    }

    // use free space
    nodes[EMPTY] = nodes[freeIdx]; // unlink free node
    nodes[freeIdx] = EMPTY; // clear free ptr

    nodes[idx] = freeIdx; // allocate free node to child
    return freeIdx;
}

/**
 * iterate through all leafs in nodes yielding the computed quadkey.
 */
function* iterate(nodes: number[], nodeIdx = TOP, currentStr = ''): Generator<string, null, void> {
    for (let key = 0; key < 4; ++key) {
        const newIdx = nodes[nodeIdx + key];
        if (newIdx === EXISTS) yield currentStr + key.toString();
        else if (newIdx !== EMPTY) yield* iterate(nodes, newIdx, currentStr + key.toString());
    }
    return null;
}

// recursive function called from QuadTrie.mergeTiles
function mergeTiles(
    nodes: number[],
    minZ: number,
    maxZ: number,
    coveringPercentage: number,
    z = 0,
    parentIdx = TOP,
): number {
    let coverCount = 0;
    let childCount = 0;
    for (let key = 0; key < 4; ++key) {
        const childIdx = nodes[parentIdx + key];
        if (childIdx !== EMPTY) {
            ++childCount;
            if (childIdx === EXISTS) {
                if (z + 1 < minZ) {
                    nodes[parentIdx + key] = EMPTY;
                    const idx = addNode(nodes, parentIdx + key);
                    for (let i = 0; i < 4; ++i) {
                        nodes[idx + i] = EXISTS;
                    }
                    nodes[EXISTS] += 3;
                }
                coverCount += 0.25;
            } else {
                let pc = mergeTiles(nodes, minZ, maxZ, coveringPercentage, z + 1, childIdx);
                if (pc < 0) {
                    // child wants us to remove them
                    pc = -pc;
                    addLeaf(nodes, parentIdx + key);
                }
                coverCount += pc * 0.25;
            }
        }
    }

    if (
        // node not too big and populated enough
        (z >= minZ && coverCount >= coveringPercentage) ||
        // node too small and would reduce node count
        (z >= maxZ && childCount > 1)
    ) {
        return -coverCount; // indicate remove us
    }
    return coverCount;
}

/**
 * Add and trace path to ancesstors of a row of tiles

 * @param level the width of the level
 */
function fillRow(nodes: number[], parentIdx: number, fromX: number, toX: number, y: number, level: number): boolean {
    let nodeCount = 0;
    const row = y < level ? 2 : 0;
    const left = fromX < level; // left or right quadrant?
    const right = toX >= level;
    const leftIdx = nodes[parentIdx + row];
    const rightIdx = nodes[parentIdx + row + 1];

    const mask = level - 1;
    fromX &= mask;
    toX &= mask;
    y &= mask;
    level = level >> 1;

    if (leftIdx === EXISTS) {
        ++nodeCount;
    } else if (left) {
        if (
            level == 0 ||
            fillRow(
                nodes,
                leftIdx === EMPTY ? addNode(nodes, parentIdx + row) : leftIdx,
                fromX,
                right ? mask : toX,
                y,
                level,
            )
        ) {
            ++nodeCount;
            addLeaf(nodes, parentIdx + row);
        }
    }

    if (rightIdx === EXISTS) {
        ++nodeCount;
    } else if (right) {
        if (
            level == 0 ||
            fillRow(
                nodes,
                rightIdx === EMPTY ? addNode(nodes, parentIdx + row + 1) : rightIdx,
                left ? 0 : fromX,
                toX,
                y,
                level,
            )
        ) {
            ++nodeCount;
            addLeaf(nodes, parentIdx + row + 1);
        }
    }

    if (nodeCount != 2) return false;

    const oRow = row == 2 ? 0 : 2;
    return nodes[parentIdx + oRow] == EXISTS && nodes[parentIdx + oRow + 1] == EXISTS;
}

/**
 * copy nodes from `nodeB` to `nodeA`
 */
function copyNodes(nodesA: number[], idxA: number, nodesB: number[], idxB: number): void {
    for (let key = 0; key < 4; ++key) {
        const cB = nodesB[idxB + key];
        if (cB !== EMPTY) {
            if (cB === EXISTS) {
                nodesA[idxA + key] = EXISTS;
                nodesA[EXISTS]++;
            } else {
                copyNodes(nodesA, addNode(nodesA, idxA + key), nodesB, cB);
            }
        }
    }
}

/**
 * Reduce nodesA to the intersection with nodesB
 */
function intersection(nodesA: number[], idxA: number, nodesB: number[], idxB: number): boolean {
    let found = false;
    for (let key = 0; key < 4; ++key) {
        const cA = nodesA[idxA + key];
        const cB = nodesB[idxB + key];
        if (cA !== EMPTY) {
            if (cB === EMPTY) {
                delNode(nodesA, idxA + key);
            } else if (cB === EXISTS) {
                found = true;
            } else if (cA === EXISTS) {
                found = true;
                nodesA[EXISTS]--;
                nodesA[idxA + key] = EMPTY;
                copyNodes(nodesA, addNode(nodesA, idxA + key), nodesB, cB);
            } else if (intersection(nodesA, cA, nodesB, cB)) {
                found = true;
            } else {
                delNode(nodesA, idxA + key);
            }
        }
    }
    return found;
}

/**
 * Reduce nodesA to the intersection with nodesB
 */
function union(nodesA: number[], idxA: number, nodesB: number[], idxB: number): boolean {
    let full = 0;
    for (let key = 0; key < 4; ++key) {
        const cA = nodesA[idxA + key];
        const cB = nodesB[idxB + key];
        if (cA === EXISTS) {
            ++full;
        } else if (cB !== EMPTY) {
            if (cB === EXISTS) {
                addLeaf(nodesA, idxA + key);
                ++full;
            } else if (cA === EMPTY) {
                copyNodes(nodesA, addNode(nodesA, idxA + key), nodesB, cB);
            } else if (union(nodesA, cA, nodesB, cB)) {
                addLeaf(nodesA, idxA + key);
                ++full;
            }
        }
    }
    return full == 4;
}

/**
 * Is there an intersection between nodesA and nodesB
 */
function hasIntersection(nodesA: number[], idxA: number, nodesB: number[], idxB: number): boolean {
    for (let key = 0; key < 4; ++key) {
        const cA = nodesA[idxA + key];
        const cB = nodesB[idxB + key];
        if (cA !== EMPTY && cB !== EMPTY) {
            if (cB === EXISTS || cA === EXISTS || hasIntersection(nodesA, cA, nodesB, cB)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Special logic to determine if top node is a leaf
 */
function topIsLeaf(nodes: number[]): boolean {
    return nodes.length == 2 && nodes[EXISTS] === EXISTS;
}
function topLeaf(): [number, number] {
    return [EMPTY, EXISTS];
}

export class QuadTrie {
    /** The trie structure including size and free space list */
    private nodes: number[];

    /**
     * An Iterate-able Trie container of XYZ tiles
     */
    constructor() {
        this.clear();
    }

    /**
     * How many quadkeys (leafs) in this container
     */
    get size(): number {
        return this.nodes[EXISTS];
    }

    /**
     * Build a QuadTrie container from a list of quad keys
     */
    static fromList(quadKeys: string[]): QuadTrie {
        const trie = new QuadTrie();
        for (const s of quadKeys) trie.add(s);
        return trie;
    }

    /**
     * Clear all contents from this trie
     */
    clear(): void {
        this.nodes = [EMPTY, EMPTY];
    }

    /**
     * Create an identical copy of this Trie
     */
    clone(): QuadTrie {
        const trie = new QuadTrie();
        trie.nodes = this.nodes.slice();
        return trie;
    }

    /**
     * Add a quad key to the trie.
     *
     * Does not allow adding higher resolution keys beneath an existing key. If a key is being added
     * over the top of any higher resolution keys they will be deleted. Does not merge full quadrants

     * @param quadKey Quadkey to add
     */
    add(quadKey: string): void {
        const { nodes } = this;
        if (topIsLeaf(nodes)) return; // top is a leaf
        if (quadKey === '') {
            this.nodes = topLeaf();
            return;
        }
        if (nodes.length == 2) {
            addNode(nodes);
        }
        let idx = TOP;
        for (let i = 0; i < quadKey.length - 1; i++) {
            idx = addNode(nodes, idx + (quadKey.charCodeAt(i) & 11));
            if (idx === EXISTS) return; // parent is a leaf
        }

        idx += quadKey.charCodeAt(quadKey.length - 1) & 11;

        addLeaf(nodes, idx);
    }

    /**
     * Fill a row of the trie container

     * @param fromX the X coord of the tile to start filling from (inclusive)
     * @param toX the X coord of the tile to end filling on (inclusive)
     * @param y the Y coord of the row to fill
     * @param z the depth (zoom level) to fill at
     */
    fillRow(fromX: number, toX = fromX, y: number, z: number): void {
        if (toX < fromX) {
            const swap = toX;
            toX = fromX;
            fromX = swap;
        }

        if (fromX > toX || z < 0) return; // nothing to fill

        if (z == 0) {
            this.nodes = topLeaf();
            return;
        }

        const level = 1 << z; // width in pixels of world at zoom level
        const mask = level - 1;

        // ensure arguments are within boundry (0 to level -1)
        if (fromX < 0) fromX = 0;
        if (fromX >= level) fromX = mask;
        if (toX < 0) toX = 0;
        if (toX >= level) toX = mask;
        if (y < 0) y = 0;
        if (y >= level) y = mask;

        const { nodes } = this;

        if (nodes.length == 2) {
            if (topIsLeaf(nodes)) return;
            addNode(nodes);
        }

        if (fillRow(this.nodes, TOP, fromX, toX, y, level >> 1)) {
            this.nodes = topLeaf();
        }
    }

    /**
     * Do the two Tries intersect
     * @param other
     */
    intersectsTrie(other: QuadTrie): boolean {
        const nodesA = this.nodes;
        const nodesB = other.nodes;
        if (this.size == 0 || other.size == 0) return false;
        if (topIsLeaf(nodesA) || topIsLeaf(nodesB)) return true;
        return hasIntersection(nodesA, TOP, nodesB, TOP);
    }

    /**
     * Make a new QuadTrie which the intersection of this QuadTrie and `other`

     * @param other
     * @return the new intersection QuadTrie
     */
    intersection(other: QuadTrie): QuadTrie {
        const nodesA = this.nodes;
        const nodesB = other.nodes;
        if (topIsLeaf(nodesA)) {
            this.clear();
            this.nodes = nodesB.slice();
        } else if (!topIsLeaf(nodesB) && nodesA.length != 2) {
            if (nodesB.length == 2) {
                this.clear();
            } else {
                intersection(nodesA, TOP, nodesB, TOP);
            }
        }

        return this;
    }

    /**
     * @param other
     * @return the new intersection QuadTrie
     */
    union(other: QuadTrie): QuadTrie {
        const nodesA = this.nodes;
        const nodesB = other.nodes;
        if (nodesA.length == 2) {
            if (topIsLeaf(nodesA)) return this;
            this.nodes = nodesB.slice();
        } else if (nodesB.length == 2) {
            if (topIsLeaf(nodesB)) {
                this.nodes = topLeaf();
            }
        } else if (union(nodesA, TOP, nodesB, TOP)) {
            this.nodes = topLeaf();
        }

        return this;
    }

    /**
     * Merge child nodes that have at least `coveringPercentage` within a zoom range of `minZ` to
     * `maxz`.

     * @param coveringPercentage min coverage in order to merge when between minZ and maxZ
     * @param minZ Don't merge any quadKeys of this length or less and split any tiles bigger than this
     * @param maxZ Merge any quadKeys of at least this length if they are an only child
     * @return the percentage covered of the world by this covering set
     */
    mergeTiles(minZ: number, maxZ = minZ, coveringPercentage = 1): number {
        const { nodes } = this;
        if (nodes.length == 2) {
            if (topIsLeaf(nodes)) {
                if (minZ < 1) return 1;
                nodes.push(EXISTS, EXISTS, EXISTS, EXISTS);
                nodes[EXISTS] = 4;
            }
        }
        const pc = mergeTiles(nodes, minZ, maxZ, coveringPercentage);
        if (pc == 1 && minZ == 0) {
            // all full
            this.nodes = topLeaf();
        }
        return pc;
    }

    /**
     * Iterate over all quad keys
     */
    *[Symbol.iterator](): Generator<string, null, void> {
        const { nodes } = this;
        if (nodes.length == 2) {
            if (nodes[EXISTS] === EXISTS) yield '';
            return null;
        }
        return yield* iterate(nodes);
    }
}
