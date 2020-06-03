import * as o from 'ospec';
import { V, VNode, VNodeElement, VNodeText } from '../vdom';

o.spec('VDom', () => {
    o('should create text nodes', () => {
        const res = V('div', 'text');

        o(res instanceof VNode).equals(true);

        const tn = res.children[0] as VNodeText;

        o(tn.text).equals('text');

        o(res.toString()).equals('<div>text</div>');
    });

    o('should create nodes', () => {
        const res = V('div', {}, V('b', [V('span', { style: 'color:red' }, 'text')]));
        o(res.toString()).equals('<div>\n  <b>\n    <span style="color:red">text</span>\n  </b>\n</div>');
    });

    o('should get set textContent', () => {
        const span = V('span', { style: 'color:red' }, 'in span');
        const res = V('div', {}, V('b', [span, 'more text', V('b')]));
        o(span.textContent).equals('in span');

        span.textContent = 'changed';
        o(res.textContent).equals('changedmore text');

        res.textContent = 'replace';
        o(res.textContent).equals('replace');
        o(res.children.length).equals(1);
        o(res.children[0] instanceof VNodeText).equals(true);
    });

    o.spec('find tags', () => {
        const iNode = V('i', 'two');
        const res = V(
            'div',
            {},
            V('b', [V('i', 'one'), V('span', { style: 'color:red' }, ['text', iNode]), V('b'), V('b')]),
        );

        o('tags', () => {
            const bees = Array.from(res.tags('b'));
            o(bees.length).equals(3);
            o((bees[0] as VNodeElement).children.length).equals(4);
        });

        o('find', () => {
            o(res.find('b', 'i', 'i')).equals(null);
            o(res.find('b', 'span', 'i')).equals(iNode);
            o(res.find('i')).notEquals(iNode);
        });
    });
});
