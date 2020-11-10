import o from 'ospec';
import { browserInstance as bi } from './browser.util';

o.spec('attribution', () => {
    const attrQuery = '#map .ol-attribution ul li';
    const waitForAttr = async (text: string): Promise<string> => {
        try {
            await bi.page.waitForFunction(
                (attrQuery: string, text: string) =>
                    document.querySelector(attrQuery)?.textContent?.indexOf(text) != -1,

                { polling: 'mutation', timeout: 1000 },
                attrQuery,
                text,
            );
        } catch (err) {
            console.error(err);
        }
        return (
            (await bi.page.evaluate(
                (attrQuery: string) => document.querySelector(attrQuery)?.textContent,
                attrQuery,
            )) ?? ''
        );
    };

    o.afterEach(async () => {
        await bi.page.goBack();
    });

    o('hutt city', async () => {
        await bi.page.goto(bi.baseUrl + '/#@-41.20243136,174.96240476,z18.1972');

        o(await waitForAttr('Hutt City')).equals(
            '© CC BY 4.0 LINZ - Hutt City 0.10m Urban Aerial Photos (2017) & others 2016-2019',
        );
    });

    o('nz', async () => {
        await bi.page.goto(bi.baseUrl + '/#@-40.94915057,167.20820794,z6');

        o(await waitForAttr('Satellite Imagery')).equals(
            '© CC BY 4.0 LINZ - \t\nNZ 10m Satellite Imagery (2019-2020) & GEBCO 2020 Grid',
        );
    });
});
