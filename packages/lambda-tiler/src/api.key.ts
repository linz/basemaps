import * as ulid from 'ulid';

const OneHourMs = 60 * 60 * 1000;
const OneDayMs = 24 * OneHourMs;
const MaxApiAgeMs = 91 * OneDayMs;

export function isValidApiKey(apiKey?: string): boolean {
    if (apiKey == null) return false;
    if (!apiKey.startsWith('c') && !apiKey.startsWith('d')) return false;
    const ulidId = apiKey.slice(1).toUpperCase();
    try {
        const ulidTime = ulid.decodeTime(ulidId);
        if (apiKey.startsWith('d')) return true;

        if (Date.now() - ulidTime > MaxApiAgeMs) {
            return false;
        }
    } catch (e) {
        return false;
    }

    return true;
}
