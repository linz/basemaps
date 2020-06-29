import o from 'ospec';
import { GitTag } from '../git.tag';

o.spec('git.tag', () => {
    o('format', () => {
        const ans = GitTag();
        o(/^v\d+\.\d+\.\d+(-\d+-g[0-9a-f]+)?$/.test(ans.version)).equals(true);
        o(/^[0-9a-f]+$/.test(ans.hash)).equals(true);
    });
});
