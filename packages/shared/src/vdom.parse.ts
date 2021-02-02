import * as sax from 'sax';
import { VNodeElement, VNodeText } from './vdom';

export class VNodeParser {
    root: VNodeElement;
    tree: VNodeElement[];

    static parse(xml: string): Promise<VNodeElement> {
        return new VNodeParser().parse(xml);
    }

    constructor() {
        this.tree = [];
    }

    get currentNode(): VNodeElement {
        return this.tree[this.tree.length - 1];
    }

    parse(xml: string): Promise<VNodeElement> {
        const parser = sax.parser(true);
        parser.ontext = (text: string): void => {
            if (text.trim() == '') return; // Skip newlines and empty text
            const textNode = new VNodeText(text);
            this.currentNode.children.push(textNode);
        };

        parser.onopentag = (tag: sax.Tag | sax.QualifiedTag): void => {
            const currentNode = new VNodeElement(tag.name, tag.attributes as any, []);
            if (this.tree.length > 0) {
                this.currentNode.children.push(currentNode);
            } else {
                this.root = currentNode;
            }
            this.tree.push(currentNode);
        };

        parser.onclosetag = (tag: string): void => {
            const lastNode = this.tree.pop();
            if (lastNode?.tag != tag) throw new Error(`Tag missmatch: ${tag}`);
        };

        return new Promise((resolve) => {
            parser.onend = (): void => resolve(this.root);
            parser.write(xml.trim()).close();
        });
    }
}
