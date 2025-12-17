/**
 * TibbyTalk - Group Service
 * Handles group creation, key management, and member operations
 */

import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS, FIELDS} from '../config/firebase';
import {
  createGroupKeyBundle,
  rotateGroupKey,
  addMemberToGroup as encryptKeyForMember,
  decryptGroupKey,
} from '../core/crypto/groupKeys';
import {getPrivateKey} from '../core/storage';
import {getUserById} from '../core/auth';
import {
  createGroupConversation,
  getConversation,
  addGroupMember as addMemberToConversation,
  removeGroupMember as removeMemberFromConversation,
} from './conversationService';
import type {Conversation, ParticipantKey} from '../types';

/**
 * Create a new group with encryption keys
 */
export async function createGroup(
  creatorId: string,
  name: string,
  memberIds: string[],
): Promise<{conversation: Conversation; groupKey: CryptoKey}> {
  // Create the conversation first
  const conversation = await createGroupConversation(creatorId, name, memberIds);

  // Generate group key and distribute to members
  const {keyBundle, groupKey} = await createGroupKeyBundle(
    conversation.participantKeys,
    creatorId,
  );

  // Update conversation with group key distribution
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversation.id)
    .update({
      [FIELDS.GROUP_KEY_ID]: keyBundle.keyId,
      [FIELDS.GROUP_KEY_DISTRIBUTION]: keyBundle.encryptedKeys,
    });

  // Store the key bundle in groupKeys collection for history
  await firestore()
    .collection(COLLECTIONS.GROUP_KEYS)
    .doc(conversation.id)
    .collection('keys')
    .doc(keyBundle.keyId)
    .set(keyBundle);

  return {
    conversation: {
      ...conversation,
      groupKeyId: keyBundle.keyId,
      groupKeyDistribution: keyBundle.encryptedKeys,
    },
    groupKey,
  };
}

/**
 * Get the current group key for a user
 */
export async function getGroupKey(
  groupId: string,
  userId: string,
): Promise<CryptoKey | null> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    return null;
  }

  const encryptedKey = conversation.groupKeyDistribution?.[userId];
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
 * Add a new member to a group (admin only)
 */
export async function addMember(
  groupId: string,
  adminId: string,
  newMemberId: string,
): Promise<void> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  // Verify admin status
  if (!conversation.adminIds?.includes(adminId)) {
    throw new Error('Only admins can add members');
  }

  // Get the current group key
  const groupKey = await getGroupKey(groupId, adminId);
  if (!groupKey) {
    throw new Error('Could not retrieve group key');
  }

  // Get new member's public key
  const newMember = await getUserById(newMemberId);
  if (!newMember) {
    throw new Error('User not found');
  }

  // Encrypt the group key for the new member
  const encryptedKeyForNewMember = await encryptKeyForMember(
    groupKey,
    newMember.publicKey,
  );

  // Add member to conversation
  await addMemberToConversation(groupId, newMemberId);

  // Update group key distribution
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(groupId)
    .update({
      [`${FIELDS.GROUP_KEY_DISTRIBUTION}.${newMemberId}`]: encryptedKeyForNewMember,
    });
}

/**
 * Remove a member from a group (admin only)
 * This also rotates the group key for security
 */
export async function removeMember(
  groupId: string,
  adminId: string,
  memberIdToRemove: string,
): Promise<CryptoKey> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  // Verify admin status
  if (!conversation.adminIds?.includes(adminId)) {
    throw new Error('Only admins can remove members');
  }

  // Cannot remove the last admin
  if (
    conversation.adminIds?.includes(memberIdToRemove) &&
    conversation.adminIds.length === 1
  ) {
    throw new Error('Cannot remove the last admin');
  }

  // Remove member from conversation
  await removeMemberFromConversation(groupId, memberIdToRemove);

  // Get remaining members' keys
  const remainingParticipantKeys: Record<string, ParticipantKey> = {};
  for (const [userId, key] of Object.entries(conversation.participantKeys)) {
    if (userId !== memberIdToRemove) {
      remainingParticipantKeys[userId] = key;
    }
  }

  // Rotate the group key (generate new key for remaining members)
  const {keyBundle, groupKey} = await rotateGroupKey(
    remainingParticipantKeys,
    adminId,
  );

  // Update conversation with new key distribution
  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(groupId)
    .update({
      [FIELDS.GROUP_KEY_ID]: keyBundle.keyId,
      [FIELDS.GROUP_KEY_DISTRIBUTION]: keyBundle.encryptedKeys,
    });

  // Store the new key in history
  await firestore()
    .collection(COLLECTIONS.GROUP_KEYS)
    .doc(groupId)
    .collection('keys')
    .doc(keyBundle.keyId)
    .set(keyBundle);

  return groupKey;
}

/**
 * Make a member an admin
 */
export async function makeAdmin(
  groupId: string,
  currentAdminId: string,
  newAdminId: string,
): Promise<void> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  if (!conversation.adminIds?.includes(currentAdminId)) {
    throw new Error('Only admins can promote members');
  }

  if (!conversation.participants.includes(newAdminId)) {
    throw new Error('User is not a member of this group');
  }

  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(groupId)
    .update({
      [FIELDS.ADMIN_IDS]: firestore.FieldValue.arrayUnion(newAdminId),
    });
}

/**
 * Remove admin status from a member
 */
export async function removeAdmin(
  groupId: string,
  currentAdminId: string,
  adminIdToRemove: string,
): Promise<void> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  if (!conversation.adminIds?.includes(currentAdminId)) {
    throw new Error('Only admins can demote members');
  }

  // Cannot remove the last admin
  if (conversation.adminIds.length === 1) {
    throw new Error('Cannot remove the last admin');
  }

  await firestore()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(groupId)
    .update({
      [FIELDS.ADMIN_IDS]: firestore.FieldValue.arrayRemove(adminIdToRemove),
    });
}

/**
 * Update group name
 */
export async function updateGroupName(
  groupId: string,
  adminId: string,
  newName: string,
): Promise<void> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  if (!conversation.adminIds?.includes(adminId)) {
    throw new Error('Only admins can rename the group');
  }

  await firestore().collection(COLLECTIONS.CONVERSATIONS).doc(groupId).update({
    [FIELDS.NAME]: newName,
    [FIELDS.UPDATED_AT]: Date.now(),
  });
}

/**
 * Leave a group
 */
export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const conversation = await getConversation(groupId);
  if (!conversation || conversation.type !== 'group') {
    throw new Error('Group not found');
  }

  // If user is the last admin, they need to promote someone first
  if (
    conversation.adminIds?.includes(userId) &&
    conversation.adminIds.length === 1 &&
    conversation.participants.length > 1
  ) {
    throw new Error(
      'You are the last admin. Please promote another member before leaving.',
    );
  }

  await removeMemberFromConversation(groupId, userId);
}
