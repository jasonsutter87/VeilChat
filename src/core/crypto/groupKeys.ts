/**
 * TibbyTalk - Group Key Management
 * Implements Sender Keys pattern for efficient group encryption
 *
 * How it works:
 * 1. When a group is created, generate a shared AES-256 key
 * 2. Encrypt the group key for each member using their RSA public key
 * 3. Store encrypted copies in groupKeyDistribution
 * 4. When sending a message, encrypt with the group key
 * 5. When a member is removed, rotate the group key
 */

import {arrayBufferToBase64, base64ToArrayBuffer} from './utils';
import {
  generateGroupSymmetricKey,
  exportSymmetricKey,
  importSymmetricKey,
  importPublicKey,
  importPrivateKey,
} from './keyGeneration';
import type {GroupEncryptedMessage, ParticipantKey} from '../../types';

const subtle = crypto.subtle;

export interface GroupKeyBundle {
  keyId: string;
  encryptedKeys: Record<string, string>; // userId -> base64 encrypted key
  createdAt: number;
  createdBy: string;
}

/**
 * Create a new group key and encrypt it for all members
 *
 * @param memberPublicKeys - Map of userId -> public key (JWK)
 * @param creatorId - ID of the user creating the group
 * @returns Group key bundle with encrypted keys for each member
 */
export async function createGroupKeyBundle(
  memberPublicKeys: Record<string, ParticipantKey>,
  creatorId: string,
): Promise<{keyBundle: GroupKeyBundle; groupKey: CryptoKey}> {
  // Generate the shared group key
  const {key: groupKey, keyId} = await generateGroupSymmetricKey();

  // Export the raw key bytes
  const rawKeyBytes = await exportSymmetricKey(groupKey);

  // Encrypt the key for each member
  const encryptedKeys: Record<string, string> = {};

  for (const [userId, participantKey] of Object.entries(memberPublicKeys)) {
    const publicKey = await importPublicKey(participantKey.publicKey);
    const encryptedKeyBytes = await subtle.encrypt(
      {name: 'RSA-OAEP'},
      publicKey,
      rawKeyBytes,
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
 *
 * @param encryptedKey - Base64 encoded encrypted group key for this user
 * @param privateKeyJwk - User's RSA private key (JWK)
 * @returns Decrypted group AES key
 */
export async function decryptGroupKey(
  encryptedKey: string,
  privateKeyJwk: JsonWebKey,
): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(privateKeyJwk);
  const encryptedKeyBytes = base64ToArrayBuffer(encryptedKey);

  const rawKeyBytes = await subtle.decrypt(
    {name: 'RSA-OAEP'},
    privateKey,
    encryptedKeyBytes,
  );

  return importSymmetricKey(rawKeyBytes);
}

/**
 * Encrypt a message for a group
 *
 * @param plaintext - Message content to encrypt
 * @param groupKey - The group's shared AES key
 * @param keyId - The ID of the group key being used
 * @returns Encrypted group message payload
 */
export async function encryptGroupMessage(
  plaintext: string,
  groupKey: CryptoKey,
  keyId: string,
): Promise<GroupEncryptedMessage> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await subtle.encrypt(
    {name: 'AES-GCM', iv},
    groupKey,
    dataBytes,
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
 *
 * @param encryptedPayload - The encrypted group message
 * @param groupKey - The group's shared AES key
 * @returns Decrypted message content
 */
export async function decryptGroupMessage(
  encryptedPayload: GroupEncryptedMessage,
  groupKey: CryptoKey,
): Promise<string> {
  const iv = base64ToArrayBuffer(encryptedPayload.iv);
  const encryptedData = base64ToArrayBuffer(encryptedPayload.data);

  const decryptedBytes = await subtle.decrypt(
    {name: 'AES-GCM', iv},
    groupKey,
    encryptedData,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

/**
 * Rotate group key (when a member is removed)
 * Creates a new key and encrypts it for remaining members only
 *
 * @param remainingMemberKeys - Public keys of members who should receive the new key
 * @param creatorId - ID of the user initiating the rotation
 * @returns New group key bundle
 */
export async function rotateGroupKey(
  remainingMemberKeys: Record<string, ParticipantKey>,
  creatorId: string,
): Promise<{keyBundle: GroupKeyBundle; groupKey: CryptoKey}> {
  // Simply create a new key bundle for the remaining members
  return createGroupKeyBundle(remainingMemberKeys, creatorId);
}

/**
 * Add a new member to a group
 * Encrypts the current group key for the new member
 *
 * @param groupKey - The current group AES key
 * @param newMemberPublicKey - New member's public key (JWK)
 * @returns Base64 encoded encrypted key for the new member
 */
export async function addMemberToGroup(
  groupKey: CryptoKey,
  newMemberPublicKey: JsonWebKey,
): Promise<string> {
  const rawKeyBytes = await exportSymmetricKey(groupKey);
  const publicKey = await importPublicKey(newMemberPublicKey);

  const encryptedKeyBytes = await subtle.encrypt(
    {name: 'RSA-OAEP'},
    publicKey,
    rawKeyBytes,
  );

  return arrayBufferToBase64(encryptedKeyBytes);
}
