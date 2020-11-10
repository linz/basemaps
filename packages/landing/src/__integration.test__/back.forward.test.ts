import o from 'ospec';
import { browserInstance as bi } from './browser.util';

o.spec('back.forward', () => {
    o.after(async () => {
        await bi.page.goto(bi.baseUrl);
    });

    o('url updated', async () => {
        await bi.page.goto(bi.baseUrl + '/#@-41.20243136,174.96240476,z18.1972');
        await bi.page.goto(bi.baseUrl + '/#@-40.94915057,167.20820794,z6');
        o(await bi.page.evaluate('location.href')).equals(bi.baseUrl + '/#@-40.94915057,167.20820794,z6');

        await bi.page.goBack();
        o(await bi.page.evaluate('location.href')).equals(bi.baseUrl + '/#@-41.20243136,174.96240476,z18.1972');

        await bi.page.goForward();
        o(await bi.page.evaluate('location.href')).equals(bi.baseUrl + '/#@-40.94915057,167.20820794,z6');
    });
});
