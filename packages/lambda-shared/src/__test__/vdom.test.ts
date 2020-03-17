import * as o from 'ospec';
import { V, VNodeType, VToString } from '../vdom';

o.spec('VDom', () => {
    o('should create text nodes', () => {
        const res = V('div', {}, ['text']);
        o(res.children[0]).deepEquals({ type: VNodeType.Raw, text: 'text' });

        o(VToString(res)).deepEquals('<div>\n  text\n</div>');
    });

    o('should create nodes', () => {
        const res = V('div', {}, [V('span', { style: 'color:red' }, 'text')]);
        o(res.children[0]).deepEquals({
            type: VNodeType.Node,
            tag: 'span',
            attrs: { style: 'color:red' },
            children: [{ type: VNodeType.Raw, text: 'text' }],
        });
        o(VToString(res)).deepEquals('<div>\n  <span style="color:red">\n    text\n  </span>\n</div>');
    });
});
