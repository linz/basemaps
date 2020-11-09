import { Env } from '@basemaps/shared';
import o from 'ospec';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as ulid from 'ulid';

const AppUrl = Env.get(Env.PublicUrlBase) ?? 'https://dev.basemaps.linz.govt.nz';

async function waitForTransitionEnd(page: Page, element: string): Promise<void> {
    await page.evaluate((element) => {
        return new Promise((resolve) => {
            const transition = document.querySelector(element);
            const onEnd = (): void => {
                transition.removeEventListener('transitionend', onEnd);
                resolve();
            };
            transition.addEventListener('transitionend', onEnd);
        });
    }, element);
}

async function clickElm(page: Page, query: string): Promise<void> {
    await page.evaluate((query: string) => {
        const elm = document.querySelector(query) as HTMLElement;
        elm?.click();
    }, query);
}

o.spec('browser', () => {
    o.specTimeout(20000);

    let browser: Browser;
    let page: Page;
    let ulStartTime = 0;

    o.before(async () => {
        browser = await puppeteer.launch({ headless: true, slowMo: 0, devtools: false });
        page = await browser.newPage();
        await page.goto(AppUrl);
        const context = browser.defaultBrowserContext();
        await context.overridePermissions(AppUrl, ['clipboard-read', 'clipboard-write']);
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
        ulStartTime = Number.parseInt(ulid.ulid().slice(0, 7), 36);
    });

    o.after(async () => {
        await browser.close();
    });

    o.spec('side-nav', () => {
        o.before(async () => {
            const transP = waitForTransitionEnd(page, '#side-nav');
            await clickElm(page, '#menu-open');
            await transP;
        });

        o.after(async () => {
            const transP = waitForTransitionEnd(page, '#side-nav');
            await clickElm(page, '#menu-close');
            await transP;
        });

        o('copy wmts urls', async () => {
            const WmtsBtn = '#api-wmts .lui-form-icon-button';

            const checkUrl = async (url: string): Promise<void> => {
                await clickElm(page, WmtsBtn);
                const [wmtsUrl, apiKey] = (await page.evaluate(() => navigator.clipboard.readText())).split('?api=');
                o(wmtsUrl).equals(url);
                const keyTime = Number.parseInt(apiKey.slice(1, 8), 36);
                o(Math.abs(keyTime - ulStartTime) < 10).equals(true);
                o(apiKey[0]).equals('c');
                o(apiKey.replace(/[a-z0-9]/g, 'x')).equals('xxxxxxxxxxxxxxxxxxxxxxxxxxx');
            };

            await checkUrl('https://dev.basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml');

            await clickElm(page, '#projection-nztm');
            await page.evaluate((WmtsBtn: string) => {
                const btn = document.querySelector(WmtsBtn) as HTMLButtonElement;
                if (btn != null) {
                    btn.disabled = false;
                }
            }, WmtsBtn);

            await checkUrl('https://dev.basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:2193/WMTSCapabilities.xml');
        });
    });

    o.spec('attribution', () => {
        o('loaded', async () => {
            const attrQuery = '#map .ol-attribution ul li';
            await page.waitForFunction(
                (attrQuery: string) => document.querySelector(attrQuery)?.textContent != 'Loading…',

                { polling: 'mutation' },
                attrQuery,
            );

            const text = await page.evaluate(
                (attrQuery: string) => document.querySelector(attrQuery)?.textContent,
                attrQuery,
            );

            o(text).equals('© CC BY 4.0 LINZ - \t\nNZ 10m Satellite Imagery (2019-2020) & GEBCO 2020 Grid');
        });
    });
});
