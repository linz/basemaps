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

    o('should find tags', () => {
        const res = V('div', {}, V('b', [V('span', { style: 'color:red' }, 'text'), V('b'), V('i'), V('b')]));

        const bees = Array.from(res.tags('b'));
        o(bees.length).equals(3);
        o((bees[0] as VNodeElement).children.length).equals(4);
    });
});
