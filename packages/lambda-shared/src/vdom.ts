export type VNodeInput = string | number | VNode;
/**
 * Two types of virtual nodes are required raw text and actual elements
 */
export enum VNodeType {
    Raw = 'raw',
    Node = 'node',
}

export type VNode = VNodeElement | VNodeText;
/** Virtual node */
export interface VNodeElement {
    type: VNodeType.Node;
    /** XML tag to use eg "div" */
    tag: string;
    attrs: Record<string, string>;
    children: VNode[];
}

/** Text virtual node */
export interface VNodeText {
    type: VNodeType.Raw;
    /** Value of the text */
    text: string;
}

/**
 * Validate and convert all children to VNodes
 *
 * @param children input to validate and convert
 */
function normalizeChildren(children?: VNodeInput[] | VNodeInput): VNode[] {
    if (children == null) {
        return [];
    }
    if (Array.isArray(children)) {
        const childNodes: VNode[] = [];
        for (const c of children) {
            if (c == null) continue;
            if (typeof c == 'string' || typeof c == 'number') {
                childNodes.push({ type: VNodeType.Raw, text: String(c) });
                continue;
            }

            childNodes.push(c);
        }
        return childNodes;
    } else if (typeof children == 'string' || typeof children == 'number') {
        return [{ type: VNodeType.Raw, text: String(children) }];
    }
    return [children];
}

/**
 * Create a virtual dom node
 *
 * @example
 * ```typescript
 * V('div', {style: 'color:red'},'Hello World')
 * ```
 *
 * @param tag DOM tag to use
 * @param attrs DOM attributes
 * @param children DOM children
 */
export function V(tag: string, attrs?: Record<string, any>, children?: VNodeInput[] | VNodeInput): VNodeElement {
    return {
        type: VNodeType.Node,
        tag,
        attrs: attrs ?? {},
        children: normalizeChildren(children),
    };
}

function VDomToStringAttrs(n: VNodeElement): string {
    const keys = Object.keys(n.attrs);
    if (keys.length == 0) {
        return '';
    }
    let out = '';
    for (const key of keys) {
        const val = n.attrs[key];
        if (val == null) continue;
        out += ` ${key}="${val}"`;
    }
    return out;
}

function VDomToStringChildren(n: VNodeElement, level = 0): string {
    if (n.children.length == 0) return '';
    const lastIndent = '  '.repeat(level);
    const indent = lastIndent + '  ';
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return `\n${indent}${n.children.map(c => VToString(c, level + 1)).join(`\n${indent}`)}\n${lastIndent}`;
}

/**
 * Convert a virtual dom node to text
 * @param node Root virtual node
 * @param level current indentation level
 */
export function VToString(node: VNode, level = 0): string {
    if (node.type == VNodeType.Raw) {
        return node.text;
    }
    const attrs = VDomToStringAttrs(node);
    return `<${node.tag}${attrs}>${VDomToStringChildren(node, level)}</${node.tag}>`;
}
