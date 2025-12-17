/**
 * TibbyTalk - Secure Key Storage
 * Uses react-native-keychain for secure storage of private keys
 * Keys are encrypted at rest by iOS Keychain / Android Keystore
 */

import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'com.tibbytalk.keys';

/**
 * Store user's private key securely on device
 * Uses hardware-backed encryption when available
 *
 * @param userId - User's ID (used as the username/key)
 * @param privateKeyJwk - Private key in JWK format
 * @returns True if stored successfully
 */
export async function storePrivateKey(
  userId: string,
  privateKeyJwk: JsonWebKey,
): Promise<boolean> {
  try {
    await Keychain.setGenericPassword(
      userId,
      JSON.stringify(privateKeyJwk),
      {
        service: `${SERVICE_NAME}.identity`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      },
    );
    return true;
  } catch (error) {
    console.error('Failed to store private key:', error);
    return false;
  }
}

/**
 * Retrieve user's private key from secure storage
 *
 * @param userId - User's ID
 * @returns Private key in JWK format, or null if not found
 */
export async function getPrivateKey(
  userId: string,
): Promise<JsonWebKey | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${SERVICE_NAME}.identity`,
    });

    if (credentials && credentials.username === userId) {
      return JSON.parse(credentials.password);
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve private key:', error);
    return null;
  }
}

/**
 * Delete user's private key from secure storage
 *
 * @returns True if deleted successfully
 */
export async function deletePrivateKey(): Promise<boolean> {
  try {
    await Keychain.resetGenericPassword({
      service: `${SERVICE_NAME}.identity`,
    });
    return true;
  } catch (error) {
    console.error('Failed to delete private key:', error);
    return false;
  }
}

/**
 * Store an encrypted group key
 *
 * @param groupId - Group's ID
 * @param encryptedKey - Base64 encoded encrypted group key
 * @returns True if stored successfully
 */
export async function storeGroupKey(
  groupId: string,
  encryptedKey: string,
): Promise<boolean> {
  try {
    await Keychain.setGenericPassword(groupId, encryptedKey, {
      service: `${SERVICE_NAME}.groups`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (error) {
    console.error('Failed to store group key:', error);
    return false;
  }
}

/**
 * Retrieve an encrypted group key
 *
 * @param groupId - Group's ID
 * @returns Encrypted group key, or null if not found
 */
export async function getGroupKey(groupId: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${SERVICE_NAME}.groups`,
    });

    if (credentials && credentials.username === groupId) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve group key:', error);
    return null;
  }
}

/**
 * Check if private key exists for a user
 *
 * @param userId - User's ID
 * @returns True if key exists
 */
export async function hasPrivateKey(userId: string): Promise<boolean> {
  const key = await getPrivateKey(userId);
  return key !== null;
}

/**
 * Check if the device supports secure hardware storage
 *
 * @returns True if secure hardware is available
 */
export async function hasSecureHardware(): Promise<boolean> {
  try {
    const securityLevel = await Keychain.getSecurityLevel();
    return securityLevel === Keychain.SECURITY_LEVEL.SECURE_HARDWARE;
  } catch {
    return false;
  }
}
