import o from 'ospec';
import { browserInstance as bi } from './browser.util';

o.spec('attribution', () => {
    o('loaded', async () => {
        const attrQuery = '#map .ol-attribution ul li';
        await bi.page.waitForFunction(
            (attrQuery: string) => document.querySelector(attrQuery)?.textContent != 'Loading…',

            { polling: 'mutation' },
            attrQuery,
        );

        const text = await bi.page.evaluate(
            (attrQuery: string) => document.querySelector(attrQuery)?.textContent,
            attrQuery,
        );

        o(text).equals('© CC BY 4.0 LINZ - \t\nNZ 10m Satellite Imagery (2019-2020) & GEBCO 2020 Grid');
    });
});
