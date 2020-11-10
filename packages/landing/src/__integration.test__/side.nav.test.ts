import o from 'ospec';
import { browserInstance as bi } from './browser.util';

o.spec('side.nav', () => {
    o.before(async () => {
        const transP = bi.waitForTransitionEnd('#side-nav');
        await bi.clickElm('#menu-open');
        await transP;
    });

    o.after(async () => {
        const transP = bi.waitForTransitionEnd('#side-nav');
        await bi.clickElm('#menu-close');
        await transP;
    });

    o('copy wmts urls', async () => {
        const WmtsBtn = '#api-wmts .lui-form-icon-button';

        const checkUrl = async (url: string): Promise<void> => {
            await bi.clickElm(WmtsBtn);
            const [wmtsUrl, apiKey] = (await bi.page.evaluate(() => navigator.clipboard.readText())).split('?api=');
            o(wmtsUrl).equals(url);
            const keyTime = Number.parseInt(apiKey.slice(1, 8), 36);
            o(Math.abs(keyTime - bi.ulStartTime) < 10).equals(true);
            o(apiKey[0]).equals('c');
            o(apiKey.replace(/[a-z0-9]/g, 'x')).equals('xxxxxxxxxxxxxxxxxxxxxxxxxxx');
        };

        await checkUrl('https://dev.basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml');

        await bi.clickElm('#projection-nztm');
        await bi.page.evaluate((WmtsBtn: string) => {
            const btn = document.querySelector(WmtsBtn) as HTMLButtonElement;
            if (btn != null) {
                btn.disabled = false;
            }
        }, WmtsBtn);

        await checkUrl('https://dev.basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:2193/WMTSCapabilities.xml');
    });

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
});
