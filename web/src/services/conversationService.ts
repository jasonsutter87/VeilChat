/**
 * TibbyTalk Web - Conversation Service
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS, FIELDS } from '../config/firebase';
import { getUserById } from '../core/auth/authService';
import type { Conversation, ParticipantKey } from '../types';

/**
 * Create a new 1:1 conversation
 */
export async function createDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<Conversation> {
  // Check if conversation already exists
  const existing = await findDirectConversation(currentUserId, otherUserId);
  if (existing) return existing;

  // Get both users' public keys
  const currentUser = await getUserById(currentUserId);
  const otherUser = await getUserById(otherUserId);

  if (!currentUser || !otherUser) {
    throw new Error('User not found');
  }

  const participantKeys: Record<string, ParticipantKey> = {
    [currentUserId]: { publicKey: currentUser.publicKey, keyId: currentUser.publicKeyId },
    [otherUserId]: { publicKey: otherUser.publicKey, keyId: otherUser.publicKeyId },
  };

  const conversationData = {
    [FIELDS.TYPE]: 'direct',
    [FIELDS.PARTICIPANTS]: [currentUserId, otherUserId],
    [FIELDS.PARTICIPANT_KEYS]: participantKeys,
    [FIELDS.CREATED_AT]: Date.now(),
    [FIELDS.UPDATED_AT]: Date.now(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), conversationData);

  return {
    id: docRef.id,
    type: 'direct',
    participants: [currentUserId, otherUserId],
    participantKeys,
    createdAt: conversationData[FIELDS.CREATED_AT],
    updatedAt: conversationData[FIELDS.UPDATED_AT],
  };
}

/**
 * Find existing direct conversation
 */
export async function findDirectConversation(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where(FIELDS.TYPE, '==', 'direct'),
    where(FIELDS.PARTICIPANTS, 'array-contains', userId1)
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data[FIELDS.PARTICIPANTS].includes(userId2)) {
      return documentToConversation(docSnap);
    }
  }

  return null;
}

/**
 * Create a group conversation
 */
export async function createGroupConversation(
  creatorId: string,
  name: string,
  memberIds: string[]
): Promise<Conversation> {
  const allMemberIds = [creatorId, ...memberIds.filter(id => id !== creatorId)];
  const participantKeys: Record<string, ParticipantKey> = {};

  for (const memberId of allMemberIds) {
    const user = await getUserById(memberId);
    if (user) {
      participantKeys[memberId] = { publicKey: user.publicKey, keyId: user.publicKeyId };
    }
  }

  const conversationData = {
    [FIELDS.TYPE]: 'group',
    [FIELDS.NAME]: name,
    [FIELDS.PARTICIPANTS]: allMemberIds,
    [FIELDS.PARTICIPANT_KEYS]: participantKeys,
    [FIELDS.ADMIN_IDS]: [creatorId],
    [FIELDS.CREATED_AT]: Date.now(),
    [FIELDS.UPDATED_AT]: Date.now(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), conversationData);

  return {
    id: docRef.id,
    type: 'group',
    name,
    participants: allMemberIds,
    participantKeys,
    adminIds: [creatorId],
    createdAt: conversationData[FIELDS.CREATED_AT],
    updatedAt: conversationData[FIELDS.UPDATED_AT],
  };
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId));
  if (!docSnap.exists()) return null;
  return documentToConversation(docSnap);
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where(FIELDS.PARTICIPANTS, 'array-contains', userId),
    orderBy(FIELDS.UPDATED_AT, 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(documentToConversation);
}

/**
 * Subscribe to conversation updates
 */
export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where(FIELDS.PARTICIPANTS, 'array-contains', userId),
    orderBy(FIELDS.UPDATED_AT, 'desc')
  );

  return onSnapshot(q, snapshot => {
    const conversations = snapshot.docs.map(documentToConversation);
    onUpdate(conversations);
  });
}

/**
 * Update last message preview
 */
export async function updateLastMessage(
  conversationId: string,
  senderId: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
    [FIELDS.LAST_MESSAGE]: {
      senderId,
      timestamp: Date.now(),
      preview: 'Encrypted message',
    },
    [FIELDS.UPDATED_AT]: Date.now(),
  });
}

// Helper to convert Firestore doc to Conversation
function documentToConversation(docSnap: any): Conversation {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    type: data[FIELDS.TYPE],
    participants: data[FIELDS.PARTICIPANTS],
    participantKeys: data[FIELDS.PARTICIPANT_KEYS],
    createdAt: data[FIELDS.CREATED_AT],
    updatedAt: data[FIELDS.UPDATED_AT],
    lastMessage: data[FIELDS.LAST_MESSAGE],
    name: data[FIELDS.NAME],
    adminIds: data[FIELDS.ADMIN_IDS],
    groupKeyId: data[FIELDS.GROUP_KEY_ID],
    groupKeyDistribution: data[FIELDS.GROUP_KEY_DISTRIBUTION],
  };
}
