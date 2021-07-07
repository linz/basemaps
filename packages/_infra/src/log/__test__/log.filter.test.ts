import o from 'ospec';
import { onLog } from '..';

o.spec('LogFilter', () => {
    o('should drop lambda logs', () => {
        o(onLog({ '@tags': ['Lambda log'] } as any)).equals(true);
        o(onLog({ '@tags': ['Flow Log'] } as any)).equals(undefined);
    });

    o('should not die if "@tags" doesnt exist', () => {
        o(onLog({} as any)).equals(undefined);
    });
});
