/**
 * TibbyTalk Web - Message Service
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS, FIELDS } from '../config/firebase';
import { encryptMessage, decryptMessage } from '../core/crypto';
import { encryptGroupMessage, decryptGroupMessage, decryptGroupKey } from '../core/crypto/groupKeys';
import { getPrivateKey } from '../core/storage/keyStorage';
import { getConversation, updateLastMessage } from './conversationService';
import type { Message, EncryptedMessage, GroupEncryptedMessage, Conversation } from '../types';

/**
 * Send an encrypted direct message
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  plaintext: string,
  ttl: number | null = null
): Promise<Message> {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const recipientId = conversation.participants.find(id => id !== senderId);
  if (!recipientId) throw new Error('Recipient not found');

  const recipientKey = conversation.participantKeys[recipientId];
  if (!recipientKey) throw new Error("Recipient's public key not found");

  const encryptedContent = await encryptMessage(plaintext, recipientKey.publicKey);

  const messageData = {
    [FIELDS.SENDER_ID]: senderId,
    [FIELDS.TIMESTAMP]: Date.now(),
    [FIELDS.TYPE]: 'direct',
    [FIELDS.ENCRYPTED]: true,
    [FIELDS.VERSION]: 'tt-e1',
    [FIELDS.ENCRYPTED_CONTENT]: encryptedContent,
    [FIELDS.TTL]: ttl,
    [FIELDS.EXPIRES_AT]: ttl ? Date.now() + ttl * 1000 : null,
    [FIELDS.READ_BY]: {},
  };

  const docRef = await addDoc(
    collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
    messageData
  );

  await updateLastMessage(conversationId, senderId);

  return {
    id: docRef.id,
    conversationId,
    senderId,
    timestamp: messageData[FIELDS.TIMESTAMP],
    type: 'direct',
    encryptedContent,
    ttl,
    expiresAt: messageData[FIELDS.EXPIRES_AT],
    readBy: {},
  };
}

/**
 * Send an encrypted group message
 */
export async function sendGroupMessage(
  conversationId: string,
  senderId: string,
  plaintext: string,
  groupKey: CryptoKey,
  keyId: string,
  ttl: number | null = null
): Promise<Message> {
  const encryptedContent = await encryptGroupMessage(plaintext, groupKey, keyId);

  const messageData = {
    [FIELDS.SENDER_ID]: senderId,
    [FIELDS.TIMESTAMP]: Date.now(),
    [FIELDS.TYPE]: 'group',
    [FIELDS.ENCRYPTED]: true,
    [FIELDS.VERSION]: 'tt-e1',
    [FIELDS.ENCRYPTED_CONTENT]: encryptedContent,
    [FIELDS.TTL]: ttl,
    [FIELDS.EXPIRES_AT]: ttl ? Date.now() + ttl * 1000 : null,
    [FIELDS.READ_BY]: {},
  };

  const docRef = await addDoc(
    collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
    messageData
  );

  await updateLastMessage(conversationId, senderId);

  return {
    id: docRef.id,
    conversationId,
    senderId,
    timestamp: messageData[FIELDS.TIMESTAMP],
    type: 'group',
    encryptedContent,
    ttl,
    expiresAt: messageData[FIELDS.EXPIRES_AT],
    readBy: {},
  };
}

/**
 * Decrypt a direct message
 */
export async function decryptDirectMessageContent(
  encryptedContent: EncryptedMessage,
  userId: string
): Promise<string> {
  const privateKey = getPrivateKey(userId);
  if (!privateKey) throw new Error('Private key not found');
  return decryptMessage(encryptedContent, privateKey);
}

/**
 * Decrypt a group message
 */
export async function decryptGroupMessageContent(
  encryptedContent: GroupEncryptedMessage,
  groupKey: CryptoKey
): Promise<string> {
  return decryptGroupMessage(encryptedContent, groupKey);
}

/**
 * Get group key for conversation
 */
export async function getGroupKeyForConversation(
  conversation: Conversation,
  userId: string
): Promise<CryptoKey | null> {
  if (conversation.type !== 'group' || !conversation.groupKeyDistribution) {
    return null;
  }

  const encryptedKey = conversation.groupKeyDistribution[userId];
  if (!encryptedKey) return null;

  const privateKey = getPrivateKey(userId);
  if (!privateKey) return null;

  return decryptGroupKey(encryptedKey, privateKey);
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string, messageLimit = 50): Promise<Message[]> {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
    orderBy(FIELDS.TIMESTAMP, 'desc'),
    limit(messageLimit)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => documentToMessage(docSnap, conversationId)).filter(Boolean) as Message[];
}

/**
 * Subscribe to messages
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (messages: Message[]) => void,
  messageLimit = 50
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
    orderBy(FIELDS.TIMESTAMP, 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs
      .map(docSnap => documentToMessage(docSnap, conversationId))
      .filter(Boolean) as Message[];
    onMessage(messages);
  });
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES, messageId),
    { [`${FIELDS.READ_BY}.${userId}`]: Date.now() }
  );
}

/**
 * Delete a message
 */
export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES, messageId)
  );
}

// Helper
function documentToMessage(docSnap: any, conversationId: string): Message | null {
  const data = docSnap.data();

  // Skip expired messages
  if (data[FIELDS.EXPIRES_AT] && data[FIELDS.EXPIRES_AT] < Date.now()) {
    return null;
  }

  return {
    id: docSnap.id,
    conversationId,
    senderId: data[FIELDS.SENDER_ID],
    timestamp: data[FIELDS.TIMESTAMP],
    type: data[FIELDS.TYPE],
    encryptedContent: data[FIELDS.ENCRYPTED_CONTENT],
    ttl: data[FIELDS.TTL],
    expiresAt: data[FIELDS.EXPIRES_AT],
    readBy: data[FIELDS.READ_BY] || {},
  };
}
