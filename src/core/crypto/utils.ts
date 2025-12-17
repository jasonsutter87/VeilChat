/**
 * TibbyTalk - Crypto Utility Functions
 * Base64 encoding/decoding for React Native
 */

/**
 * Convert ArrayBuffer to Base64 string
 * React Native compatible (no btoa)
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;

    if (isNaN(byte2)) {
      result += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    } else if (isNaN(byte3)) {
      result += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    } else {
      result +=
        chars.charAt(enc1) +
        chars.charAt(enc2) +
        chars.charAt(enc3) +
        chars.charAt(enc4);
    }
  }

  return result;
}

/**
 * Convert Base64 string to ArrayBuffer
 * React Native compatible (no atob)
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  // Remove padding
  const cleanBase64 = base64.replace(/=+$/, '');
  const length = (cleanBase64.length * 3) / 4;
  const bytes = new Uint8Array(length);

  let p = 0;
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const enc1 = chars.indexOf(cleanBase64.charAt(i));
    const enc2 = chars.indexOf(cleanBase64.charAt(i + 1));
    const enc3 = chars.indexOf(cleanBase64.charAt(i + 2));
    const enc4 = chars.indexOf(cleanBase64.charAt(i + 3));

    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== -1) {
      bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    }
    if (enc4 !== -1) {
      bytes[p++] = ((enc3 & 3) << 6) | enc4;
    }
  }

  return bytes.buffer;
}

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) and variant (RFC4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
