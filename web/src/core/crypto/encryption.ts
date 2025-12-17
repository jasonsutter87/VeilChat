/**
 * TibbyTalk Web - Client-Side Encryption Module
 * Uses native Web Crypto API (same algorithms as mobile app)
 * Based on VeilForms encryption patterns
 */

import type { EncryptedMessage, EncryptedKeyBundle } from '../../types';

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a symmetric AES-256 key for message encryption
 */
async function generateSymmetricKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a new RSA-2048 key pair for a user
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey,
    privateKey,
    keyId: generateKeyId(),
    createdAt: Date.now(),
  };
}

/**
 * Generate a random key ID
 */
export function generateKeyId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt a message for a single recipient (1:1 chat)
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyJwk: JsonWebKey
): Promise<EncryptedMessage> {
  // Import the recipient's public key
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    recipientPublicKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  // Generate a one-time symmetric key
  const symmetricKey = await generateSymmetricKey();

  // Encrypt the message with AES-GCM
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    symmetricKey,
    dataBytes
  );

  // Export and encrypt the symmetric key with RSA
  const symmetricKeyBytes = await crypto.subtle.exportKey('raw', symmetricKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    symmetricKeyBytes
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
 */
export async function decryptMessage(
  encryptedPayload: EncryptedMessage,
  privateKeyJwk: JsonWebKey
): Promise<string> {
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  // Decrypt the symmetric key
  const encryptedKeyBytes = base64ToArrayBuffer(encryptedPayload.key);
  const symmetricKeyBytes = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKeyBytes
  );

  // Import the symmetric key
  const symmetricKey = await crypto.subtle.importKey(
    'raw',
    symmetricKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const iv = base64ToArrayBuffer(encryptedPayload.iv);
  const encryptedData = base64ToArrayBuffer(encryptedPayload.data);

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    symmetricKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

/**
 * Hash a value using SHA-256
 */
export async function hashField(value: string, salt = ''): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Derive key from password using PBKDF2
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export private keys with password protection
 */
export async function exportPrivateKeys(
  privateKeys: Record<string, JsonWebKey>,
  password: string
): Promise<EncryptedKeyBundle> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const encryptionKey = await deriveKeyFromPassword(password, salt, iterations);

  const encoder = new TextEncoder();
  const keysJson = JSON.stringify(privateKeys);
  const keysData = encoder.encode(keysJson);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    keysData
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
 */
export async function importPrivateKeys(
  encryptedBundle: EncryptedKeyBundle,
  password: string
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

  const salt = new Uint8Array(base64ToArrayBuffer(encryptedBundle.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedBundle.iv));
  const ciphertext = base64ToArrayBuffer(encryptedBundle.ciphertext);
  const iterations = encryptedBundle.iterations || 100000;

  const decryptionKey = await deriveKeyFromPassword(password, salt, iterations);

  try {
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      decryptionKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    const keysJson = decoder.decode(decryptedData);
    return JSON.parse(keysJson);
  } catch {
    throw new Error('Invalid password or corrupted key bundle');
  }
}

// Group encryption functions
export async function generateGroupKey(): Promise<{ key: CryptoKey; keyId: string }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, keyId: generateKeyId() };
}

export async function exportSymmetricKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

export async function importSymmetricKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

export { arrayBufferToBase64, base64ToArrayBuffer };
