/**
 * TibbyTalk - Key Generation Module
 * RSA-2048-OAEP key pair generation for user identity
 */

import {generateKeyId} from './utils';
import type {KeyPair} from '../../types';

const subtle = crypto.subtle;

/**
 * Generate a new RSA-2048 key pair for a user
 * Called once during registration, private key stored securely on device
 *
 * @returns Key pair with public/private keys in JWK format
 */
export async function generateUserKeyPair(): Promise<KeyPair> {
  const keyPair = await subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt'],
  );

  const publicKey = await subtle.exportKey('jwk', keyPair.publicKey);
  const privateKey = await subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey,
    privateKey,
    keyId: generateKeyId(),
    createdAt: Date.now(),
  };
}

/**
 * Generate a symmetric AES-256 key for group encryption
 *
 * @returns AES-256 key with unique keyId
 */
export async function generateGroupSymmetricKey(): Promise<{
  key: CryptoKey;
  keyId: string;
}> {
  const key = await subtle.generateKey({name: 'AES-GCM', length: 256}, true, [
    'encrypt',
    'decrypt',
  ]);

  return {
    key,
    keyId: generateKeyId(),
  };
}

/**
 * Export a symmetric key to raw bytes (for RSA encryption)
 *
 * @param key - The CryptoKey to export
 * @returns Raw key bytes as ArrayBuffer
 */
export async function exportSymmetricKey(key: CryptoKey): Promise<ArrayBuffer> {
  return subtle.exportKey('raw', key);
}

/**
 * Import a symmetric key from raw bytes
 *
 * @param keyBytes - Raw key bytes
 * @returns Imported CryptoKey
 */
export async function importSymmetricKey(
  keyBytes: ArrayBuffer,
): Promise<CryptoKey> {
  return subtle.importKey('raw', keyBytes, {name: 'AES-GCM'}, true, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Import an RSA public key from JWK format
 *
 * @param publicKeyJwk - Public key in JWK format
 * @returns Imported CryptoKey for encryption
 */
export async function importPublicKey(
  publicKeyJwk: JsonWebKey,
): Promise<CryptoKey> {
  return subtle.importKey(
    'jwk',
    publicKeyJwk,
    {name: 'RSA-OAEP', hash: 'SHA-256'},
    false,
    ['encrypt'],
  );
}

/**
 * Import an RSA private key from JWK format
 *
 * @param privateKeyJwk - Private key in JWK format
 * @returns Imported CryptoKey for decryption
 */
export async function importPrivateKey(
  privateKeyJwk: JsonWebKey,
): Promise<CryptoKey> {
  return subtle.importKey(
    'jwk',
    privateKeyJwk,
    {name: 'RSA-OAEP', hash: 'SHA-256'},
    false,
    ['decrypt'],
  );
}
