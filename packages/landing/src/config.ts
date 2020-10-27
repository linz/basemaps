import { getApiKey } from '@basemaps/shared/build/api';

const currentApiKey: string = getApiKey();
export const Config = {
    get BaseUrl(): string | undefined {
        return process.env.TILE_HOST;
    },
    get ApiKey(): string {
        return currentApiKey;
    },
    get GoogleAnalytics(): string {
        return process.env.GOOGLE_ANALYTICS ?? '';
    },
};

// Inject google analytics after everything has loaded
if (Config.GoogleAnalytics != '' && typeof window != 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(): void {
        window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
    };
    window.gtag('js', new Date());
    window.gtag('config', `${Config.GoogleAnalytics}`);
    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${Config.GoogleAnalytics}`);
    document.head.appendChild(script);
}

export const enum GaEvent {
    TileTiming = 'TileTiming',
    Ui = 'Ui',
}

export function gaEvent(category: GaEvent, action: string, value?: number): void {
    if (Config.GoogleAnalytics == '') return;
    window.gtag('event', action, { event_category: category, value });
}
