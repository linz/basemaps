import { ulid, decodeTime } from 'ulid';

const hasLocalStorage = (): boolean => typeof localStorage != 'undefined';
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const API_EXPIRE_TIME = 90 * ONE_DAY_MS;

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
        if (Date.now() - API_EXPIRE_TIME < keyCreatedAt) return apiKey;
        return newApiKey();
    } catch (e) {
        // If they key fails to parse as a ulid, just generate a new key
        return newApiKey();
    }
}
