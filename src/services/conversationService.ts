/**
 * TibbyTalk - Conversation Service
 * Handles conversation creation, listing, and management
 */

import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {COLLECTIONS, FIELDS} from '../config/firebase';
import {getUserById} from '../core/auth';
import type {Conversation, User, ParticipantKey} from '../types';

/**
 * Create a new 1:1 conversation between two users
 */
export async function createDirectConversation(
  currentUserId: string,
  otherUserId: string,
): Promise<Conversation> {
  // Check if conversation already exists
  const existing = await findDirectConversation(currentUserId, otherUserId);
  if (existing) {
    return existing;
  }

  // Get both users' public keys
  const currentUser = await getUserById(currentUserId);
  const otherUser = await getUserById(otherUserId);

  if (!currentUser || !otherUser) {
    throw new Error('User not found');
  }

  const participantKeys: Record<string, ParticipantKey> = {
    [currentUserId]: {
      publicKey: currentUser.publicKey,
      keyId: currentUser.publicKeyId,
    },
    [otherUserId]: {
      publicKey: otherUser.publicKey,
      keyId: otherUser.publicKeyId,
    },
  };

  const conversationData = {
    [FIELDS.TYPE]: 'direct',
    [FIELDS.PARTICIPANTS]: [currentUserId, otherUserId],
    [FIELDS.PARTICIPANT_KEYS]: participantKeys,
    [FIELDS.CREATED_AT]: Date.now(),
    [FIELDS.UPDATED_AT]: Date.now(),
  };

  const docRef = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .add(conversationData);

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
 * Find existing direct conversation between two users
 */
export async function findDirectConversation(
  userId1: string,
  userId2: string,
): Promise<Conversation | null> {
  const snapshot = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .where(FIELDS.TYPE, '==', 'direct')
    .where(FIELDS.PARTICIPANTS, 'array-contains', userId1)
    .get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data[FIELDS.PARTICIPANTS].includes(userId2)) {
      return documentToConversation(doc);
    }
  }

  return null;
}

/**
 * Create a new group conversation
 */
export async function createGroupConversation(
  creatorId: string,
  name: string,
  memberIds: string[],
): Promise<Conversation> {
  // Include creator in members
  const allMemberIds = [creatorId, ...memberIds.filter(id => id !== creatorId)];

  // Get all members' public keys
  const participantKeys: Record<string, ParticipantKey> = {};

  for (const memberId of allMemberIds) {
    const user = await getUserById(memberId);
    if (user) {
      participantKeys[memberId] = {
        publicKey: user.publicKey,
        keyId: user.publicKeyId,
      };
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

  const docRef = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .add(conversationData);

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
 * Get a conversation by ID
 */
export async function getConversation(
  conversationId: string,
): Promise<Conversation | null> {
  const doc = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return documentToConversation(doc);
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string,
): Promise<Conversation[]> {
  const snapshot = await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .where(FIELDS.PARTICIPANTS, 'array-contains', userId)
    .orderBy(FIELDS.UPDATED_AT, 'desc')
    .get();

  return snapshot.docs.map(documentToConversation);
}

/**
 * Subscribe to conversation updates for a user
 */
export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void,
): () => void {
  return firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .where(FIELDS.PARTICIPANTS, 'array-contains', userId)
    .orderBy(FIELDS.UPDATED_AT, 'desc')
    .onSnapshot(snapshot => {
      const conversations = snapshot.docs.map(documentToConversation);
      onUpdate(conversations);
    });
}

/**
 * Update conversation's last message preview
 */
export async function updateLastMessage(
  conversationId: string,
  senderId: string,
): Promise<void> {
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .update({
      [FIELDS.LAST_MESSAGE]: {
        senderId,
        timestamp: Date.now(),
        preview: 'Encrypted message',
      },
      [FIELDS.UPDATED_AT]: Date.now(),
    });
}

/**
 * Add a member to a group conversation
 */
export async function addGroupMember(
  conversationId: string,
  newMemberId: string,
): Promise<void> {
  const user = await getUserById(newMemberId);
  if (!user) {
    throw new Error('User not found');
  }

  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .update({
      [FIELDS.PARTICIPANTS]: firestore.FieldValue.arrayUnion(newMemberId),
      [`${FIELDS.PARTICIPANT_KEYS}.${newMemberId}`]: {
        publicKey: user.publicKey,
        keyId: user.publicKeyId,
      },
      [FIELDS.UPDATED_AT]: Date.now(),
    });
}

/**
 * Remove a member from a group conversation
 */
export async function removeGroupMember(
  conversationId: string,
  memberId: string,
): Promise<void> {
  const conversationRef = firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId);

  // Use transaction to safely update
  await firestore().runTransaction(async transaction => {
    const doc = await transaction.get(conversationRef);
    if (!doc.exists) {
      throw new Error('Conversation not found');
    }

    const data = doc.data()!;
    const participantKeys = {...data[FIELDS.PARTICIPANT_KEYS]};
    delete participantKeys[memberId];

    transaction.update(conversationRef, {
      [FIELDS.PARTICIPANTS]: firestore.FieldValue.arrayRemove(memberId),
      [FIELDS.PARTICIPANT_KEYS]: participantKeys,
      [FIELDS.UPDATED_AT]: Date.now(),
    });
  });
}

/**
 * Convert Firestore document to Conversation type
 */
function documentToConversation(
  doc: FirebaseFirestoreTypes.QueryDocumentSnapshot | FirebaseFirestoreTypes.DocumentSnapshot,
): Conversation {
  const data = doc.data()!;

  return {
    id: doc.id,
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
