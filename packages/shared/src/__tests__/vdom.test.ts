import assert from 'node:assert';
import { describe, it } from 'node:test';

import { V, VNode, VNodeElement, VNodeText } from '../vdom.js';

describe('VDom', () => {
  it('should create text nodes', () => {
    const res = V('div', 'text');

    assert.equal(res instanceof VNode, true);

    const tn = res.children[0] as VNodeText;

    assert.equal(tn.textContent, 'text');

    assert.equal(res.toString(), '<div>text</div>');
  });

  it('should encode text nodes', () => {
    const res = V('div', 'text & ; < > &amp;');

    assert.equal(res instanceof VNode, true);

    const tn = res.children[0] as VNodeText;

    assert.equal(tn.textContent, 'text &amp; ; &lt; &gt; &amp;amp;');

    assert.equal(res.toString(), '<div>text &amp; ; &lt; &gt; &amp;amp;</div>');
  });

  it('should not encode valid utf8', () => {
    const res = V('div', 'Kaikōura 🦄 🌈');

    assert.equal(res.textContent, 'Kaikōura 🦄 🌈');
    assert.equal(res.toString(), '<div>Kaikōura 🦄 🌈</div>');
  });

  it('should create nodes', () => {
    const res = V('div', {}, V('b', [V('span', { style: 'color:red' }, 'text')]));
    assert.equal(res.toString(), '<div>\n  <b>\n    <span style="color:red">text</span>\n  </b>\n</div>');
  });

  it('should get set textContent', () => {
    const span = V('span', { style: 'color:red' }, 'in span');
    const res = V('div', {}, V('b', [span, 'more text', V('b')]));
    assert.equal(span.textContent, 'in span');

    span.textContent = 'changed';
    assert.equal(res.textContent, 'changedmore text');

    res.textContent = 'replace';
    assert.equal(res.textContent, 'replace');
    assert.equal(res.children.length, 1);
    assert.equal(res.children[0] instanceof VNodeText, true);
  });

  describe('find tags', () => {
    const iNode = V('i', 'two');
    const res = V(
      'div',
      {},
      V('b', [V('i', 'one'), V('span', { style: 'color:red' }, ['text', iNode]), V('b'), V('b')]),
    );

    it('tags', () => {
      const bees = Array.from(res.tags('b'));
      assert.equal(bees.length, 3);
      assert.equal((bees[0] as VNodeElement).children.length, 4);
    });

    it('find', () => {
      assert.equal(res.find('b', 'i', 'i'), null);
      assert.equal(res.find('b', 'span', 'i'), iNode);
      assert.notEqual(res.find('i'), iNode);
    });
  });
});
