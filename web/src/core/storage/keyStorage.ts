/**
 * TibbyTalk Web - Key Storage
 * Uses localStorage for key storage (IndexedDB alternative available)
 *
 * NOTE: localStorage is less secure than mobile Keychain/Keystore.
 * Keys are stored in browser storage and could be accessed by malicious scripts.
 * For production, consider using IndexedDB with encryption or a more secure solution.
 */

const STORAGE_PREFIX = 'tibbytalk_';
const IDENTITY_KEY = `${STORAGE_PREFIX}identity_`;
const GROUP_KEY = `${STORAGE_PREFIX}group_`;

/**
 * Store user's private key
 */
export function storePrivateKey(userId: string, privateKeyJwk: JsonWebKey): boolean {
  try {
    localStorage.setItem(`${IDENTITY_KEY}${userId}`, JSON.stringify(privateKeyJwk));
    return true;
  } catch (error) {
    console.error('Failed to store private key:', error);
    return false;
  }
}

/**
 * Retrieve user's private key
 */
export function getPrivateKey(userId: string): JsonWebKey | null {
  try {
    const stored = localStorage.getItem(`${IDENTITY_KEY}${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve private key:', error);
    return null;
  }
}

/**
 * Delete user's private key
 */
export function deletePrivateKey(userId: string): boolean {
  try {
    localStorage.removeItem(`${IDENTITY_KEY}${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete private key:', error);
    return false;
  }
}

/**
 * Store an encrypted group key
 */
export function storeGroupKey(groupId: string, encryptedKey: string): boolean {
  try {
    localStorage.setItem(`${GROUP_KEY}${groupId}`, encryptedKey);
    return true;
  } catch (error) {
    console.error('Failed to store group key:', error);
    return false;
  }
}

/**
 * Retrieve an encrypted group key
 */
export function getGroupKey(groupId: string): string | null {
  try {
    return localStorage.getItem(`${GROUP_KEY}${groupId}`);
  } catch (error) {
    console.error('Failed to retrieve group key:', error);
    return null;
  }
}

/**
 * Check if private key exists for a user
 */
export function hasPrivateKey(userId: string): boolean {
  return getPrivateKey(userId) !== null;
}

/**
 * Clear all stored keys (logout)
 */
export function clearAllKeys(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}
