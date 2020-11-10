import { Env } from '@basemaps/shared';
import o from 'ospec';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as ulid from 'ulid';

const AppUrl = Env.get(Env.PublicUrlBase) || 'https://dev.basemaps.linz.govt.nz';

export let browserInstance = (undefined as unknown) as BrowserUtil;

o.specTimeout(20000);

o.before(async () => {
    const browser = await puppeteer.launch({ headless: true, slowMo: 0, devtools: false });
    const page = await browser.newPage();
    await page.goto(AppUrl);
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(AppUrl, ['clipboard-read', 'clipboard-write']);
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    browserInstance = new BrowserUtil(browser, page);
});

o.after(async () => {
    if (browserInstance != null) {
        await browserInstance.browser.close();
    }
});

export class BrowserUtil {
    browser: Browser;
    page: Page;
    ulStartTime = 0;

    constructor(browser: Browser, page: Page) {
        this.browser = browser;
        this.page = page;
        this.ulStartTime = Number.parseInt(ulid.ulid().slice(0, 7), 36);
    }

    async clickElm(query: string): Promise<void> {
        await this.page.evaluate((query: string) => {
            const elm = document.querySelector(query) as HTMLElement;
            elm?.click();
        }, query);
    }

    async waitForTransitionEnd(element: string): Promise<void> {
        await this.page.evaluate((element) => {
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
}
