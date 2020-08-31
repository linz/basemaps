import o from 'ospec';
import { onLog } from '..';

o('LogFilter', () => {
    o('should drop lambda logs', () => {
        o(onLog({ '@tags': ['Lambda Log'] } as any)).equals(true);
        o(onLog({ '@tags': ['Flow Log'] } as any)).equals(true);
    });

    o('should not die if "@tags" doesnt exist', () => {
        o(onLog({} as any)).equals(false);
    });
});
