import { ulid, decodeTime } from 'ulid';

const hasLocalStorage = (): boolean => typeof localStorage !== 'undefined';
export const OneDayMs = 24 * 60 * 60 * 1000;
/** Generate a new api key for the user every 30 days */
const ApiKeyExpireMs = 30 * OneDayMs;

function newApiKey(): string {
    const newKey = 'c' + ulid().toLowerCase();
    if (hasLocalStorage()) localStorage.setItem('api-key', newKey);
    return newKey;
}

export function getApiKey(): string {
    if (!hasLocalStorage()) return newApiKey();
    const apiKey = localStorage.getItem('api-key');

    if (apiKey == null) return newApiKey();
    if (!apiKey.startsWith('c')) return newApiKey();

    try {
        const keyCreatedAt = decodeTime(apiKey.slice(1).toUpperCase());
        if (Date.now() - ApiKeyExpireMs < keyCreatedAt) return apiKey;
        return newApiKey();
    } catch (e) {
        // If they key fails to parse as a ulid, just generate a new key
        return newApiKey();
    }
}
