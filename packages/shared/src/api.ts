import { decodeTime, ulid } from 'ulid';

const hasLocalStorage = (): boolean => typeof localStorage !== 'undefined';
export const OneDayMs = 24 * 60 * 60 * 1000;
/** Generate a new api key for the user every 30 days */
const ApiKeyExpireMs = 30 * OneDayMs;
export const ApiKeyMaxAgeMs = 91 * OneDayMs;

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

export type ApiKeyStatus = ApiKeyStatusValid | ApiKeyStatusInvalid;

export interface ApiKeyStatusValid {
  valid: true;
  key: string;
}

export interface ApiKeyStatusInvalid {
  valid: false;
  message: 'malformed' | 'missing' | 'expired';
}

export function isValidApiKey(apiKey?: string | null): ApiKeyStatus {
  if (apiKey == null) return { valid: false, message: 'missing' };
  if (!apiKey.startsWith('c') && !apiKey.startsWith('d')) return { valid: false, message: 'malformed' };
  const ulidId = apiKey.slice(1).toUpperCase();
  try {
    decodeTime(ulidId); // validate the key looks valid
    if (apiKey.startsWith('d')) return { valid: true, key: apiKey };

    // Re-enable to disable older api keys
    // if (Date.now() - ulidTime > ApiKeyMaxAgeMs) return { valid: false, message: 'expired' };
  } catch (e) {
    return { valid: false, message: 'malformed' };
  }

  return { valid: true, key: apiKey };
}

/** Truncate a API key to the last 6 digits */
export function truncateApiKey(x: unknown): string | undefined {
  if (typeof x !== 'string') return 'invalid';
  if (x.startsWith('c')) return 'c' + x.slice(x.length - 6);
  if (x.startsWith('d')) return 'd' + x.slice(x.length - 6);
  return 'invalid';
}
