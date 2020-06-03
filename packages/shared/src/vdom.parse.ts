import * as sax from 'sax';
import { VNodeElement, VNodeText } from './vdom';

export class VNodeParser {
    root: VNodeElement;
    parser: sax.SAXParser;
    tree: VNodeElement[];

    static parse(xml: string): Promise<VNodeElement> {
        return new VNodeParser().parse(xml);
    }

    constructor() {
        this.tree = [];
        this.parser = sax.parser(true);
    }

    get currentNode(): VNodeElement {
        return this.tree[this.tree.length - 1];
    }

    parse(xml: string): Promise<VNodeElement> {
        this.parser.ontext = (text: string): void => {
            if (text.trim() == '') return; // Skip newlines and empty text
            const textNode = new VNodeText(text);
            this.currentNode.children.push(textNode);
        };

        this.parser.onopentag = (tag: sax.Tag | sax.QualifiedTag): void => {
            const currentNode = new VNodeElement(tag.name, tag.attributes as any, []);
            if (this.tree.length > 0) {
                this.currentNode.children.push(currentNode);
            } else {
                this.root = currentNode;
            }
            this.tree.push(currentNode);
        };

        this.parser.onclosetag = (tag: string): void => {
            const lastNode = this.tree.pop();
            if (lastNode?.tag != tag) throw new Error(`Tag missmatch: ${tag}`);
        };

        return new Promise((resolve) => {
            this.parser.onend = (): void => resolve(this.root);
            this.parser.write(xml.trim()).close();
        });
    }
}
