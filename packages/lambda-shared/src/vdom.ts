export type VNodeInput = string | number | VNode;

const indent = (level: number): string => '  '.repeat(level);

/**
 * Virtual Node for storing `sgml` style documents
 **/
export abstract class VNode {
    /**
     * Convert a virtual dom node to sgml text
     * @param level current indentation level
     */
    toString(level = 0): string {
        return indent(level) + '[VNode]';
    }

    /** Find elements with `tag` */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    *tags(tag: string): Generator<VNode, void, void> {
        return;
    }

    abstract get textContent(): string;
    abstract set textContent(v: string);
}

/**
 * Virtual Text Node for storing text leaf nodes
 **/
export class VNodeText extends VNode {
    text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    toString(level = 0): string {
        return indent(level) + this.text;
    }

    get textContent(): string {
        return this.text;
    }

    set textContent(v: string) {
        this.text = v;
    }
}

/**
 * Virtual Element Node for storing tagged elements
 **/
export class VNodeElement extends VNode {
    tag: string;
    attrs: Record<string, string>;
    children: VNode[];

    constructor(tag: string, attrs: Record<string, string>, children: VNode[]) {
        super();
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    }

    get textContent(): string {
        if (this.children.length == 0) return '';
        if (this.children.length == 1) {
            return this.children[0].textContent;
        }
        return this.children.map((c) => c.textContent).join('');
    }

    set textContent(v: string) {
        this.children = [new VNodeText(v)];
    }

    toString(level = 0): string {
        const attrs = this.toStringAttrs();
        const padding = indent(level);
        const children = this.toStringChildren(level);
        const result = `${padding}<${this.tag}${attrs}`;

        if (children == '') return `${result} />`;
        return `${result}>${children}</${this.tag}>`;
    }

    *tags(tag: string): Generator<VNode, void, void> {
        if (this.tag === tag) yield this;

        for (const child of this.children) yield* child.tags(tag);
    }

    private toStringAttrs(): string {
        const keys = Object.keys(this.attrs);
        if (keys.length == 0) {
            return '';
        }
        let out = '';
        for (const key of keys) {
            const val = this.attrs[key];
            if (val == null) continue;
            out += ` ${key}="${val}"`;
        }
        return out;
    }

    private toStringChildren(level = 0): string {
        if (this.children.length == 0) return '';
        if (this.children.length == 1) {
            const n1 = this.children[0];
            if (n1 instanceof VNodeText) return n1.text;
        }
        return `\n${this.children.map((c) => c.toString(level + 1)).join(`\n`)}\n${indent(level)}`;
    }
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
                childNodes.push(new VNodeText(String(c)));
                continue;
            }

            childNodes.push(c);
        }
        return childNodes;
    } else if (typeof children == 'string' || typeof children == 'number') {
        return [new VNodeText(String(children))];
    }
    return [children];
}

/**
 * Create a virtual dom node
 *
 * @example
 * ```typescript
 * V('div', {style: 'color:red'}, 'Hello World')
 * V('div', ['one', V('b', 'two')])
 * V('p')
 * ```
 *
 * @param tag DOM tag to use
 * @param attrs DOM attributes
 * @param children DOM children
 */
export function V(tag: string): VNodeElement;
export function V(tag: string, children: VNodeInput[] | VNodeInput): VNodeElement;
export function V(tag: string, attrs: Record<string, any>, children?: VNodeInput[] | VNodeInput): VNodeElement;
export function V(tag: string, arg1?: any, children?: VNodeInput[] | VNodeInput): VNodeElement {
    const hasAttrs = typeof arg1 === 'object' && !Array.isArray(arg1);
    if (!hasAttrs) {
        if (children != null) throw new Error('Invalid input');
        children = arg1;
    }

    return new VNodeElement(tag, hasAttrs ? arg1 : {}, normalizeChildren(children));
}
