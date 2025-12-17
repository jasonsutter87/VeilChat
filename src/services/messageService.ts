/**
 * TibbyTalk - Message Service
 * Handles sending and receiving encrypted messages
 */

import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {COLLECTIONS, FIELDS} from '../config/firebase';
import {encryptMessage, decryptMessage} from '../core/crypto';
import {
  encryptGroupMessage,
  decryptGroupMessage,
  decryptGroupKey,
} from '../core/crypto/groupKeys';
import {getPrivateKey} from '../core/storage';
import {getConversation, updateLastMessage} from './conversationService';
import type {
  Message,
  DecryptedMessage,
  EncryptedMessage,
  GroupEncryptedMessage,
  Conversation,
} from '../types';

/**
 * Send an encrypted message in a 1:1 conversation
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  plaintext: string,
  ttl: number | null = null,
): Promise<Message> {
  // Get conversation to find recipient's public key
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Find recipient (the other participant)
  const recipientId = conversation.participants.find(id => id !== senderId);
  if (!recipientId) {
    throw new Error('Recipient not found');
  }

  const recipientKey = conversation.participantKeys[recipientId];
  if (!recipientKey) {
    throw new Error("Recipient's public key not found");
  }

  // Encrypt the message
  const encryptedContent = await encryptMessage(plaintext, recipientKey.publicKey);

  // Create message document
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

  const docRef = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .add(messageData);

  // Update conversation's last message
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
 * Send an encrypted message in a group conversation
 */
export async function sendGroupMessage(
  conversationId: string,
  senderId: string,
  plaintext: string,
  groupKey: CryptoKey,
  keyId: string,
  ttl: number | null = null,
): Promise<Message> {
  // Encrypt with group key
  const encryptedContent = await encryptGroupMessage(plaintext, groupKey, keyId);

  // Create message document
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

  const docRef = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .add(messageData);

  // Update conversation's last message
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
  userId: string,
): Promise<string> {
  const privateKey = await getPrivateKey(userId);
  if (!privateKey) {
    throw new Error('Private key not found');
  }

  return decryptMessage(encryptedContent, privateKey);
}

/**
 * Decrypt a group message
 */
export async function decryptGroupMessageContent(
  encryptedContent: GroupEncryptedMessage,
  groupKey: CryptoKey,
): Promise<string> {
  return decryptGroupMessage(encryptedContent, groupKey);
}

/**
 * Get the group key for a conversation
 */
export async function getGroupKeyForConversation(
  conversation: Conversation,
  userId: string,
): Promise<CryptoKey | null> {
  if (conversation.type !== 'group' || !conversation.groupKeyDistribution) {
    return null;
  }

  const encryptedKey = conversation.groupKeyDistribution[userId];
  if (!encryptedKey) {
    return null;
  }

  const privateKey = await getPrivateKey(userId);
  if (!privateKey) {
    return null;
  }

  return decryptGroupKey(encryptedKey, privateKey);
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
): Promise<Message[]> {
  const snapshot = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .orderBy(FIELDS.TIMESTAMP, 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(documentToMessage).filter(Boolean) as Message[];
}

/**
 * Subscribe to messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (messages: Message[]) => void,
  limit = 50,
): () => void {
  return firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .orderBy(FIELDS.TIMESTAMP, 'desc')
    .limit(limit)
    .onSnapshot(snapshot => {
      const messages = snapshot.docs
        .map(documentToMessage)
        .filter(Boolean) as Message[];
      onMessage(messages);
    });
}

/**
 * Mark a message as read by a user
 */
export async function markMessageAsRead(
  conversationId: string,
  messageId: string,
  userId: string,
): Promise<void> {
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .doc(messageId)
    .update({
      [`${FIELDS.READ_BY}.${userId}`]: Date.now(),
    });
}

/**
 * Delete an expired message
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .doc(messageId)
    .delete();
}

/**
 * Convert Firestore document to Message type
 */
function documentToMessage(
  doc: FirebaseFirestoreTypes.QueryDocumentSnapshot,
): Message | null {
  const data = doc.data();

  // Skip if message has expired
  if (data[FIELDS.EXPIRES_AT] && data[FIELDS.EXPIRES_AT] < Date.now()) {
    return null;
  }

  return {
    id: doc.id,
    conversationId: doc.ref.parent.parent?.id || '',
    senderId: data[FIELDS.SENDER_ID],
    timestamp: data[FIELDS.TIMESTAMP],
    type: data[FIELDS.TYPE],
    encryptedContent: data[FIELDS.ENCRYPTED_CONTENT],
    ttl: data[FIELDS.TTL],
    expiresAt: data[FIELDS.EXPIRES_AT],
    readBy: data[FIELDS.READ_BY] || {},
  };
}
