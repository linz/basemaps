import { getApiKey } from './api';

const currentApiKey: string = getApiKey();
export const Config = {
    get BaseUrl(): string | undefined {
        return process.env.TILE_HOST;
    },
    get ApiKey(): string {
        return currentApiKey;
    },
    get GoogleAnalytics(): string | undefined {
        return process.env.GOOGLE_ANALYTICS;
    },
};

// Inject google analytics after everything has loaded
if (Config.GoogleAnalytics != null && typeof window != 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]): void {
        window.dataLayer.push(args);
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
}

export function gaEvent(category: GaEvent, label: string, value: number): void {
    if (Config.GoogleAnalytics == null) return;
    window.gtag('event', { category, label, value });
}
