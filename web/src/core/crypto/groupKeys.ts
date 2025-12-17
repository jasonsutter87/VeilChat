/**
 * TibbyTalk Web - Group Key Management
 * Same Sender Keys pattern as mobile app
 */

import {
  generateGroupKey,
  exportSymmetricKey,
  importSymmetricKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './encryption';
import type { GroupEncryptedMessage, ParticipantKey } from '../../types';

export interface GroupKeyBundle {
  keyId: string;
  encryptedKeys: Record<string, string>;
  createdAt: number;
  createdBy: string;
}

/**
 * Create a new group key and encrypt it for all members
 */
export async function createGroupKeyBundle(
  memberPublicKeys: Record<string, ParticipantKey>,
  creatorId: string
): Promise<{ keyBundle: GroupKeyBundle; groupKey: CryptoKey }> {
  const { key: groupKey, keyId } = await generateGroupKey();
  const rawKeyBytes = await exportSymmetricKey(groupKey);

  const encryptedKeys: Record<string, string> = {};

  for (const [userId, participantKey] of Object.entries(memberPublicKeys)) {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      participantKey.publicKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    const encryptedKeyBytes = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      rawKeyBytes
    );
    encryptedKeys[userId] = arrayBufferToBase64(encryptedKeyBytes);
  }

  return {
    keyBundle: {
      keyId,
      encryptedKeys,
      createdAt: Date.now(),
      createdBy: creatorId,
    },
    groupKey,
  };
}

/**
 * Decrypt the group key for a specific user
 */
export async function decryptGroupKey(
  encryptedKey: string,
  privateKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  const encryptedKeyBytes = base64ToArrayBuffer(encryptedKey);
  const rawKeyBytes = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKeyBytes
  );

  return importSymmetricKey(rawKeyBytes);
}

/**
 * Encrypt a message for a group
 */
export async function encryptGroupMessage(
  plaintext: string,
  groupKey: CryptoKey,
  keyId: string
): Promise<GroupEncryptedMessage> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    groupKey,
    dataBytes
  );

  return {
    encrypted: true,
    version: 'tt-e1',
    data: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
    keyId,
  };
}

/**
 * Decrypt a group message
 */
export async function decryptGroupMessage(
  encryptedPayload: GroupEncryptedMessage,
  groupKey: CryptoKey
): Promise<string> {
  const iv = base64ToArrayBuffer(encryptedPayload.iv);
  const encryptedData = base64ToArrayBuffer(encryptedPayload.data);

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    groupKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

/**
 * Rotate group key (when a member is removed)
 */
export async function rotateGroupKey(
  remainingMemberKeys: Record<string, ParticipantKey>,
  creatorId: string
): Promise<{ keyBundle: GroupKeyBundle; groupKey: CryptoKey }> {
  return createGroupKeyBundle(remainingMemberKeys, creatorId);
}

/**
 * Add a new member to a group
 */
export async function addMemberToGroup(
  groupKey: CryptoKey,
  newMemberPublicKey: JsonWebKey
): Promise<string> {
  const rawKeyBytes = await exportSymmetricKey(groupKey);
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    newMemberPublicKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encryptedKeyBytes = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawKeyBytes
  );

  return arrayBufferToBase64(encryptedKeyBytes);
}
