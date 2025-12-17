/**
 * TibbyTalk - Client-Side Encryption Module
 * Ported from VeilForms with React Native adaptations
 * Uses hybrid encryption: RSA-2048-OAEP + AES-256-GCM
 */

import {arrayBufferToBase64, base64ToArrayBuffer} from './utils';
import type {EncryptedMessage, EncryptedKeyBundle} from '../../types';

// Use global crypto (polyfilled by react-native-quick-crypto)
const subtle = crypto.subtle;

/**
 * Generate a symmetric AES-256 key for message encryption
 */
async function generateSymmetricKey(): Promise<CryptoKey> {
  return subtle.generateKey({name: 'AES-GCM', length: 256}, true, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypt a message for a single recipient (1:1 chat)
 * Uses hybrid encryption: AES for data, RSA for the AES key
 *
 * @param plaintext - The message content to encrypt
 * @param recipientPublicKeyJwk - Recipient's RSA public key in JWK format
 * @returns Encrypted payload ready for storage
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyJwk: JsonWebKey,
): Promise<EncryptedMessage> {
  // Import the recipient's public key
  const publicKey = await subtle.importKey(
    'jwk',
    recipientPublicKeyJwk,
    {name: 'RSA-OAEP', hash: 'SHA-256'},
    false,
    ['encrypt'],
  );

  // Generate a one-time symmetric key for this message
  const symmetricKey = await generateSymmetricKey();

  // Encrypt the message with AES-GCM
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await subtle.encrypt(
    {name: 'AES-GCM', iv},
    symmetricKey,
    dataBytes,
  );

  // Export and encrypt the symmetric key with RSA
  const symmetricKeyBytes = await subtle.exportKey('raw', symmetricKey);
  const encryptedKey = await subtle.encrypt(
    {name: 'RSA-OAEP'},
    publicKey,
    symmetricKeyBytes,
  );

  return {
    encrypted: true,
    version: 'tt-e1',
    data: arrayBufferToBase64(encryptedData),
    key: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt a received message
 *
 * @param encryptedPayload - The encrypted message payload
 * @param privateKeyJwk - Recipient's RSA private key in JWK format
 * @returns Decrypted message content
 */
export async function decryptMessage(
  encryptedPayload: EncryptedMessage,
  privateKeyJwk: JsonWebKey,
): Promise<string> {
  // Import the private key
  const privateKey = await subtle.importKey(
    'jwk',
    privateKeyJwk,
    {name: 'RSA-OAEP', hash: 'SHA-256'},
    false,
    ['decrypt'],
  );

  // Decrypt the symmetric key
  const encryptedKeyBytes = base64ToArrayBuffer(encryptedPayload.key);
  const symmetricKeyBytes = await subtle.decrypt(
    {name: 'RSA-OAEP'},
    privateKey,
    encryptedKeyBytes,
  );

  // Import the symmetric key
  const symmetricKey = await subtle.importKey(
    'raw',
    symmetricKeyBytes,
    {name: 'AES-GCM'},
    false,
    ['decrypt'],
  );

  // Decrypt the data
  const iv = base64ToArrayBuffer(encryptedPayload.iv);
  const encryptedData = base64ToArrayBuffer(encryptedPayload.data);

  const decryptedBytes = await subtle.decrypt(
    {name: 'AES-GCM', iv},
    symmetricKey,
    encryptedData,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

/**
 * Encrypt data with a symmetric key (for group messages)
 *
 * @param plaintext - The message content to encrypt
 * @param symmetricKey - AES-256 group key
 * @returns Encrypted data and IV
 */
export async function encryptWithSymmetricKey(
  plaintext: string,
  symmetricKey: CryptoKey,
): Promise<{data: string; iv: string}> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await subtle.encrypt(
    {name: 'AES-GCM', iv},
    symmetricKey,
    dataBytes,
  );

  return {
    data: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt data with a symmetric key (for group messages)
 *
 * @param encryptedData - Base64 encoded encrypted data
 * @param iv - Base64 encoded IV
 * @param symmetricKey - AES-256 group key
 * @returns Decrypted message content
 */
export async function decryptWithSymmetricKey(
  encryptedData: string,
  iv: string,
  symmetricKey: CryptoKey,
): Promise<string> {
  const ivBytes = base64ToArrayBuffer(iv);
  const dataBytes = base64ToArrayBuffer(encryptedData);

  const decryptedBytes = await subtle.decrypt(
    {name: 'AES-GCM', iv: ivBytes},
    symmetricKey,
    dataBytes,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

/**
 * Hash a value using SHA-256 (for anonymous matching/deduplication)
 *
 * @param value - Value to hash
 * @param salt - Optional salt for the hash
 * @returns Base64 encoded hash
 */
export async function hashField(value: string, salt = ''): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + value.toLowerCase().trim());
  const hashBuffer = await subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Derive an encryption key from a password using PBKDF2
 *
 * @param password - User's password
 * @param salt - Random salt (should be stored alongside encrypted data)
 * @param iterations - Number of PBKDF2 iterations (default: 100000)
 * @returns Derived AES-256 encryption key
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    encoder.encode(password),
    {name: 'PBKDF2'},
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Export private keys with password protection
 * Creates an encrypted bundle that can be safely backed up
 *
 * @param privateKeys - Object mapping keyId -> privateKey (JWK)
 * @param password - Password to encrypt the keys (min 8 chars)
 * @returns Encrypted key bundle ready for backup
 */
export async function exportPrivateKeys(
  privateKeys: Record<string, JsonWebKey>,
  password: string,
): Promise<EncryptedKeyBundle> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  // Derive encryption key from password
  const encryptionKey = await deriveKeyFromPassword(password, salt, iterations);

  // Serialize the private keys
  const encoder = new TextEncoder();
  const keysJson = JSON.stringify(privateKeys);
  const keysData = encoder.encode(keysJson);

  // Encrypt the keys
  const encryptedData = await subtle.encrypt(
    {name: 'AES-GCM', iv},
    encryptionKey,
    keysData,
  );

  return {
    version: '1.0',
    algorithm: 'PBKDF2-AES-GCM-256',
    iterations,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(encryptedData),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import private keys from encrypted bundle
 *
 * @param encryptedBundle - The encrypted key bundle
 * @param password - Password to decrypt the keys
 * @returns Decrypted private keys object
 */
export async function importPrivateKeys(
  encryptedBundle: EncryptedKeyBundle,
  password: string,
): Promise<Record<string, JsonWebKey>> {
  if (!encryptedBundle || !encryptedBundle.ciphertext) {
    throw new Error('Invalid key bundle format');
  }

  if (!password) {
    throw new Error('Password is required');
  }

  if (encryptedBundle.version !== '1.0') {
    throw new Error('Unsupported key bundle version');
  }

  // Extract bundle components
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedBundle.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedBundle.iv));
  const ciphertext = base64ToArrayBuffer(encryptedBundle.ciphertext);
  const iterations = encryptedBundle.iterations || 100000;

  // Derive decryption key from password
  const decryptionKey = await deriveKeyFromPassword(password, salt, iterations);

  // Decrypt the keys
  try {
    const decryptedData = await subtle.decrypt(
      {name: 'AES-GCM', iv},
      decryptionKey,
      ciphertext,
    );

    const decoder = new TextDecoder();
    const keysJson = decoder.decode(decryptedData);
    return JSON.parse(keysJson);
  } catch {
    throw new Error('Invalid password or corrupted key bundle');
  }
}
