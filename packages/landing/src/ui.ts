import { Basemaps } from './map';
import { Epsg } from '@basemaps/geo';
import { WindowUrl, MapOptionType } from './url';
import { gaEvent, GaEvent } from './config';

export class BasemapsUi {
    projectionNztm: HTMLElement;
    projectionWm: HTMLElement;

    apiXyz: HTMLElement;
    apiWmts: HTMLElement;

    basemaps: Basemaps;

    menuClose: HTMLElement;
    menuOpen: HTMLElement;
    sideNav: HTMLElement;
    projection: Epsg;

    constructor(basemaps: Basemaps) {
        this.basemaps = basemaps;
        this.bindMenuButton();
        this.bindProjectionButtons();
        this.bindApiLinks();
        this.bindMenuButton();
        this.bindContactUsButton();

        this.setCurrentProjection(this.basemaps.config.tileMatrix.projection);
    }
    bindMenuButton(): void {
        const menuOpen = document.getElementById('menu-open');
        const menuClose = document.getElementById('menu-close');
        const sideNav = document.getElementById('side-nav');

        if (menuOpen == null || menuClose == null || sideNav == null) {
            throw new Error('Unable to find menu button');
        }
        this.menuOpen = menuOpen;

        menuOpen.onclick = this.menuOnClick;
        menuClose.onclick = this.menuOnClick;

        this.menuClose = menuClose;
        this.sideNav = sideNav;
    }

    bindContactUsButton(): void {
        const button = document.getElementById('contact-us');
        if (button == null) {
            throw new Error('Unable to find contact-us button');
        }

        button.onclick = (): void => {
            const subject = 'Request Basemaps Developer Access';
            const body = `
Give us a few key details to sign up for Developer Access to LINZ Basemaps. We will respond with your Apps' unique API key.

Your Name:

Your Email:

Your Service/App URL:

`;
            gaEvent(GaEvent.Ui, 'contact-us:click');

            location.href = `mailto:basemaps@linz.govt.nz?subject=${encodeURI(subject)}&body=${encodeURI(body)}`;
        };
    }

    menuOnClick = (): void => {
        if (this.sideNav.classList.contains('side-nav--opened')) {
            gaEvent(GaEvent.Ui, 'menu:close');
            this.sideNav.classList.remove('side-nav--opened');
            this.sideNav.setAttribute('aria-hidden', 'true');
        } else {
            gaEvent(GaEvent.Ui, 'menu:open');
            this.sideNav.classList.add('side-nav--opened');
            this.sideNav.setAttribute('aria-hidden', 'false');
        }
    };

    bindApiLinks(): void {
        const apiXyz = document.getElementById('api-xyz');
        const apiWmts = document.getElementById('api-wmts');
        if (apiXyz == null || apiWmts == null) {
            throw new Error('Unable to find api inputs');
        }
        this.apiXyz = apiXyz;
        this.apiWmts = apiWmts;
        this.bindCopyFromInput(apiXyz);
        this.bindCopyFromInput(apiWmts);
    }

    /** Attach a listener to a button to copy the nearby input element */
    bindCopyFromInput(el: HTMLElement): void {
        const inputEl = el.querySelector('input');
        if (inputEl == null) throw new Error('Cannot find input');
        const buttonEl = el.querySelector('button');
        if (buttonEl == null) throw new Error('Cannot find button');
        const buttonIconEl = buttonEl.querySelector('i');
        if (buttonIconEl == null) throw new Error('Cannot find button icon');
        buttonIconEl.textContent = 'content_copy';

        buttonEl.onclick = (): void => {
            if (buttonEl.disabled) return;
            gaEvent(GaEvent.Ui, 'copy:' + el.id.replace('api-', '') + ':' + this.projection);

            inputEl.select();
            document.execCommand('copy');

            const originalTitle = buttonEl.title;
            buttonIconEl.innerText = 'check';
            buttonEl.disabled = true;
            buttonEl.title = 'Copied';
            buttonEl.classList.add('lui-form-icon-button--copied');

            setTimeout(() => {
                buttonEl.classList.remove('lui-form-icon-button--copied');
                buttonEl.title = originalTitle;
                buttonEl.disabled = false;
                buttonIconEl.textContent = 'content_copy';
            }, 1500);
        };
    }

    bindProjectionButtons(): void {
        const projectionNztm = document.getElementById('projection-nztm');
        const projectionWm = document.getElementById('projection-wm');
        if (projectionNztm == null || projectionWm == null) {
            throw new Error('Unable to find projection buttons');
        }
        this.projectionNztm = projectionNztm;
        this.projectionNztm.onclick = this.projectionOnClick;

        this.projectionWm = projectionWm;
        this.projectionWm.onclick = this.projectionOnClick;
    }

    projectionOnClick = (e: MouseEvent): void => {
        const target = e.target as HTMLInputElement;
        if (target.classList == null) return;
        if (target.classList.contains('lui-button-active')) return;
        if (target === this.projectionNztm) {
            this.setCurrentProjection(Epsg.Nztm2000);
        } else {
            this.setCurrentProjection(Epsg.Google);
        }
    };

    setCurrentProjection(projection: Epsg): void {
        gaEvent(GaEvent.Ui, 'projection:' + projection.code);
        this.projection = projection;

        if (projection === Epsg.Nztm2000) {
            this.projectionNztm.classList.add('lui-button-active');
            this.projectionWm.classList.remove('lui-button-active');
            this.apiXyz.classList.add('display-none');
        } else {
            this.projectionWm.classList.add('lui-button-active');
            this.projectionNztm.classList.remove('lui-button-active');
            this.apiXyz.classList.remove('display-none');
        }
        const cfg = { ...this.basemaps.config, projection };

        this.apiXyz.querySelector('input')!.value = WindowUrl.toTileUrl(cfg, MapOptionType.Tile);
        this.apiWmts.querySelector('input')!.value = WindowUrl.toTileUrl(cfg, MapOptionType.Wmts);
    }
}
