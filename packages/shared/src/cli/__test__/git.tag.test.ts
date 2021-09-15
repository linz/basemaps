import o from 'ospec';
import { GitTag } from '../git.tag.js';

o.spec('git.tag', () => {
    o('format', () => {
        const ans = GitTag();
        o(/^v\d+\.\d+\.\d+(-\d+-g[0-9a-f]+)?$/.test(ans.version)).equals(true)(`Got: ${ans.version}`);
        o(/^[0-9a-f]+$/.test(ans.hash)).equals(true)(`Got: ${ans.hash}`);
    });
});
